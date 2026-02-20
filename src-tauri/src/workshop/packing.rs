use super::{
    find_config_file, is_valid_project_name, load_mod_project, load_workshop_project, PackFormat,
    PackProjectArgs, PackResult, ValidationResult, Workshop, WorkshopProject,
};
use crate::error::{AppError, AppResult};
use camino::Utf8PathBuf;
use std::fs;
use std::path::PathBuf;

impl Workshop {
    /// Pack a workshop project to .modpkg or .fantome format.
    pub fn pack_project(&self, args: PackProjectArgs) -> AppResult<PackResult> {
        let project_path = PathBuf::from(&args.project_path);
        if !project_path.exists() {
            return Err(AppError::ProjectNotFound(args.project_path));
        }

        let project_path_utf8 = Utf8PathBuf::try_from(project_path.clone())
            .map_err(|_| AppError::InvalidPath("Project path is not valid UTF-8".to_string()))?;

        // Load and validate project
        let config_path = find_config_file(&project_path)
            .ok_or_else(|| AppError::ProjectNotFound(args.project_path.clone()))?;
        let mut mod_project = load_mod_project(&config_path)?;

        // Resolve thumbnail path so packers (fantome/modpkg) can include it
        if mod_project.thumbnail.is_none() {
            if project_path.join("thumbnail.webp").exists() {
                mod_project.thumbnail = Some("thumbnail.webp".to_string());
            } else if project_path.join("thumbnail.png").exists() {
                mod_project.thumbnail = Some("thumbnail.png".to_string());
            }
        }

        // Determine output directory
        let output_dir = args
            .output_dir
            .map(Utf8PathBuf::from)
            .unwrap_or_else(|| project_path_utf8.join("build"));

        // Create output directory if needed
        fs::create_dir_all(output_dir.as_std_path())?;

        match args.format {
            PackFormat::Modpkg => {
                let file_name = ltk_modpkg::project::create_file_name(&mod_project, None);
                let output_path = output_dir.join(&file_name);

                ltk_modpkg::project::pack_from_project(
                    &project_path_utf8,
                    &output_path,
                    &mod_project,
                )
                .map_err(|e| AppError::PackFailed(e.to_string()))?;

                Ok(PackResult {
                    output_path: output_path.to_string(),
                    file_name,
                    format: "modpkg".to_string(),
                })
            }
            PackFormat::Fantome => {
                let file_name = ltk_fantome::create_file_name(&mod_project, None);
                let output_path = output_dir.join(&file_name);

                let file = fs::File::create(output_path.as_std_path())?;
                let writer = std::io::BufWriter::new(file);

                ltk_fantome::pack_to_fantome(writer, &mod_project, project_path_utf8.as_std_path())
                    .map_err(|e| AppError::PackFailed(e.to_string()))?;

                Ok(PackResult {
                    output_path: output_path.to_string(),
                    file_name,
                    format: "fantome".to_string(),
                })
            }
        }
    }

    /// Validate a project before packing.
    pub fn validate_project(&self, project_path: &str) -> AppResult<ValidationResult> {
        let path = PathBuf::from(project_path);
        if !path.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Check for config file
        let config_path = match find_config_file(&path) {
            Some(p) => p,
            None => {
                errors.push("No mod.config.json or mod.config.toml found".to_string());
                return Ok(ValidationResult {
                    valid: false,
                    errors,
                    warnings,
                });
            }
        };

        // Try to load config
        let mod_project = match load_mod_project(&config_path) {
            Ok(p) => p,
            Err(e) => {
                errors.push(format!("Failed to parse config: {}", e));
                return Ok(ValidationResult {
                    valid: false,
                    errors,
                    warnings,
                });
            }
        };

        // Validate name
        if !is_valid_project_name(&mod_project.name) {
            errors
                .push("Project name must be lowercase alphanumeric with hyphens only".to_string());
        }

        // Validate version
        if semver::Version::parse(&mod_project.version).is_err() {
            errors.push(format!(
                "Invalid version format: {} (expected semver like 1.0.0)",
                mod_project.version
            ));
        }

        // Check content directory exists
        let content_dir = path.join("content");
        if !content_dir.exists() {
            errors.push("content/ directory not found".to_string());
        } else {
            // Check layer directories
            for layer in &mod_project.layers {
                let layer_dir = content_dir.join(&layer.name);
                if !layer_dir.exists() {
                    errors.push(format!("Layer directory content/{} not found", layer.name));
                } else if layer_dir.read_dir().map(|d| d.count() == 0).unwrap_or(true) {
                    warnings.push(format!("Layer content/{} is empty", layer.name));
                }
            }
        }

        // Check for base layer
        if !mod_project.layers.iter().any(|l| l.name == "base") {
            warnings.push("No 'base' layer defined".to_string());
        }

        // Check thumbnail
        if !path.join("thumbnail.webp").exists() && !path.join("thumbnail.png").exists() {
            warnings.push("No thumbnail found (thumbnail.webp or thumbnail.png)".to_string());
        }

        Ok(ValidationResult {
            valid: errors.is_empty(),
            errors,
            warnings,
        })
    }

    /// Set a project's thumbnail image.
    pub fn set_thumbnail(
        &self,
        project_path: &str,
        image_path: &str,
    ) -> AppResult<WorkshopProject> {
        let project_dir = PathBuf::from(project_path);
        if !project_dir.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        // Verify it's a valid project
        if find_config_file(&project_dir).is_none() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let source_path = PathBuf::from(image_path);
        if !source_path.exists() {
            return Err(AppError::InvalidPath(image_path.to_string()));
        }

        let extension = source_path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .unwrap_or_default();

        let supported_formats = [
            "webp", "png", "jpg", "jpeg", "gif", "bmp", "tiff", "tif", "ico",
        ];
        if !supported_formats.contains(&extension.as_str()) {
            return Err(AppError::ValidationFailed(format!(
                "Unsupported image format: {}. Supported formats: {}",
                extension,
                supported_formats.join(", ")
            )));
        }

        let webp_data = if extension == "webp" {
            image::open(&source_path)
                .map_err(|e| AppError::ValidationFailed(format!("Failed to open image: {}", e)))?;
            fs::read(&source_path)?
        } else {
            // Encode as lossy WebP to avoid lossless bloat (the image crate's
            // WebP encoder is lossless-only and can inflate a 1 MB JPEG to 5+ MB)
            let img = image::open(&source_path)
                .map_err(|e| AppError::ValidationFailed(format!("Failed to open image: {}", e)))?;
            let encoder = webp::Encoder::from_image(&img)
                .map_err(|e| AppError::ValidationFailed(format!("Failed to encode WebP: {}", e)))?;
            encoder.encode(90.0).to_vec()
        };

        let target_path = project_dir.join("thumbnail.webp");
        let tmp_path = project_dir.join("thumbnail.webp.tmp");

        fs::write(&tmp_path, webp_data)?;

        if target_path.exists() {
            let _ = fs::remove_file(&target_path);
        }
        fs::rename(&tmp_path, &target_path)?;

        let _ = fs::remove_file(project_dir.join("thumbnail.png"));

        // Persist the thumbnail reference in mod.config.json
        let config_path = find_config_file(&project_dir)
            .ok_or_else(|| AppError::ProjectNotFound(project_path.to_string()))?;
        let mut mod_project = load_mod_project(&config_path)?;
        mod_project.thumbnail = Some("thumbnail.webp".to_string());
        let json_config_path = project_dir.join("mod.config.json");
        fs::write(
            &json_config_path,
            serde_json::to_string_pretty(&mod_project)?,
        )?;

        load_workshop_project(&project_dir)
    }

    /// Get a project's thumbnail path (validates it exists).
    pub fn get_thumbnail(&self, thumbnail_path: &str) -> AppResult<String> {
        let path = PathBuf::from(thumbnail_path);
        if !path.exists() {
            return Err(AppError::InvalidPath(thumbnail_path.to_string()));
        }
        Ok(thumbnail_path.to_string())
    }
}
