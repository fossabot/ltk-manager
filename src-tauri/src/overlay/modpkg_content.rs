use camino::Utf8PathBuf;
use ltk_mod_project::{ModProject, ModProjectAuthor, ModProjectLayer};
use ltk_modpkg::Modpkg;
use ltk_overlay::content::ModContentProvider;
use ltk_overlay::error::Result;
use ltk_wad::Wad;
use std::collections::HashSet;
use std::io::{Cursor, Read, Seek};

/// Content provider that reads directly from a mounted `.modpkg` archive.
pub struct ModpkgContent<R: Read + Seek> {
    modpkg: Modpkg<R>,
}

impl<R: Read + Seek> ModpkgContent<R> {
    pub fn new(modpkg: Modpkg<R>) -> Self {
        Self { modpkg }
    }
}

impl<R: Read + Seek + Send> ModContentProvider for ModpkgContent<R> {
    fn mod_project(&mut self) -> Result<ModProject> {
        let metadata = self.modpkg.load_metadata().map_err(|e| {
            ltk_overlay::Error::Other(format!("Failed to load modpkg metadata: {}", e))
        })?;

        let mut layers: Vec<ModProjectLayer> = self
            .modpkg
            .layers
            .values()
            .map(|l| {
                let meta_layer = metadata.layers.iter().find(|ml| ml.name == l.name);
                ModProjectLayer {
                    name: l.name.clone(),
                    priority: l.priority,
                    description: meta_layer.and_then(|ml| ml.description.clone()),
                    string_overrides: meta_layer
                        .map(|ml| ml.string_overrides.clone())
                        .unwrap_or_default(),
                }
            })
            .collect();
        layers.sort_by(|a, b| a.priority.cmp(&b.priority).then(a.name.cmp(&b.name)));

        if !layers.iter().any(|l| l.name == "base") {
            layers.insert(0, ModProjectLayer::base());
        }

        Ok(ModProject {
            name: metadata.name,
            display_name: metadata.display_name,
            version: metadata.version.to_string(),
            description: metadata.description.unwrap_or_default(),
            authors: metadata
                .authors
                .into_iter()
                .map(|a| ModProjectAuthor::Name(a.name))
                .collect(),
            license: None,
            transformers: Vec::new(),
            layers,
            thumbnail: None,
        })
    }

    fn list_layer_wads(&mut self, layer: &str) -> Result<Vec<String>> {
        let layer_hash = ltk_modpkg::hash_layer_name(layer);

        let mut wad_names: HashSet<String> = HashSet::new();

        for &(path_hash, chunk_layer_hash) in self.modpkg.chunks.keys() {
            if chunk_layer_hash != layer_hash {
                continue;
            }

            let path = match self.modpkg.chunk_paths.get(&path_hash) {
                Some(p) => p,
                None => continue,
            };
            if path.starts_with("_meta_/") {
                continue;
            }

            // The WAD name is the first path component (e.g., "Aatrox.wad.client/data/...")
            if let Some(wad_name) = path.split('/').next() {
                if wad_name.to_ascii_lowercase().ends_with(".wad.client") {
                    wad_names.insert(wad_name.to_string());
                }
            }
        }

        Ok(wad_names.into_iter().collect())
    }

    fn read_wad_overrides(
        &mut self,
        layer: &str,
        wad_name: &str,
    ) -> Result<Vec<(Utf8PathBuf, Vec<u8>)>> {
        let layer_hash = ltk_modpkg::hash_layer_name(layer);
        let wad_prefix = format!("{}/", wad_name);

        // Collect (path_hash, layer_hash, relative_path) for matching chunks
        let matching: Vec<(u64, u64, String)> = self
            .modpkg
            .chunks
            .keys()
            .filter_map(|&(path_hash, chunk_layer_hash)| {
                if chunk_layer_hash != layer_hash {
                    return None;
                }
                let path = self.modpkg.chunk_paths.get(&path_hash)?;
                if path.starts_with("_meta_/") {
                    return None;
                }
                let rel = path.strip_prefix(&wad_prefix)?;
                Some((path_hash, chunk_layer_hash, rel.to_string()))
            })
            .collect();

        let mut results = Vec::with_capacity(matching.len());
        for (path_hash, layer_hash, rel_path) in matching {
            let bytes = self
                .modpkg
                .load_chunk_decompressed_by_hash(path_hash, layer_hash)
                .map_err(|e| {
                    ltk_overlay::Error::Other(format!(
                        "Failed to decompress modpkg chunk {:016x}: {}",
                        path_hash, e
                    ))
                })?;
            results.push((Utf8PathBuf::from(rel_path), bytes.into_vec()));
        }

        if !results.is_empty() {
            return Ok(results);
        }

        // No directory-style entries found — check for a packed WAD chunk
        // (where the chunk path IS the WAD name with no sub-path)
        for &(path_hash, chunk_layer_hash) in self.modpkg.chunks.keys() {
            if chunk_layer_hash != layer_hash {
                continue;
            }
            let path = match self.modpkg.chunk_paths.get(&path_hash) {
                Some(p) => p,
                None => continue,
            };
            if path.as_str() == wad_name {
                return self.read_packed_wad_entries(path_hash, layer_hash);
            }
        }

        Ok(Vec::new())
    }
}

impl<R: Read + Seek + Send> ModpkgContent<R> {
    /// Read a packed WAD from a modpkg chunk and return its entries as override files.
    ///
    /// Each WAD entry is returned with a hex-hash filename (e.g., "0123456789abcdef.bin")
    /// which the overlay builder's `resolve_chunk_hash` can interpret directly.
    fn read_packed_wad_entries(
        &mut self,
        path_hash: u64,
        layer_hash: u64,
    ) -> Result<Vec<(Utf8PathBuf, Vec<u8>)>> {
        let wad_data = self
            .modpkg
            .load_chunk_decompressed_by_hash(path_hash, layer_hash)
            .map_err(|e| {
                ltk_overlay::Error::Other(format!(
                    "Failed to decompress packed WAD chunk {:016x}: {}",
                    path_hash, e
                ))
            })?;

        let cursor = Cursor::new(wad_data.into_vec());
        let mut wad = Wad::mount(cursor)?;

        let wad_path_hashes: Vec<u64> = wad.chunks().iter().map(|c| c.path_hash).collect();
        let mut results = Vec::with_capacity(wad_path_hashes.len());

        for wad_path_hash in wad_path_hashes {
            let chunk = *wad.chunks().get(wad_path_hash).ok_or_else(|| {
                ltk_overlay::Error::Other(format!("WAD chunk {:016x} disappeared", wad_path_hash))
            })?;

            let bytes = wad.load_chunk_decompressed(&chunk)?.to_vec();

            // Use hex hash as filename — resolve_chunk_hash will parse it correctly
            let hex_name = format!("{:016x}.bin", wad_path_hash);
            results.push((Utf8PathBuf::from(hex_name), bytes));
        }

        Ok(results)
    }
}
