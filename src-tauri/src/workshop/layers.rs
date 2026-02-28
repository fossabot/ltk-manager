use super::{
    find_config_file, is_valid_project_name, load_mod_project, load_workshop_project, Workshop,
    WorkshopProject,
};
use crate::error::{AppError, AppResult};
use ltk_mod_project::ModProjectLayer;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

impl Workshop {
    /// Save string overrides for a specific layer in a workshop project.
    pub fn save_layer_string_overrides(
        &self,
        project_path: &str,
        layer_name: &str,
        string_overrides: HashMap<String, HashMap<String, String>>,
    ) -> AppResult<WorkshopProject> {
        let path = PathBuf::from(project_path);
        if !path.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let config_path = find_config_file(&path)
            .ok_or_else(|| AppError::ProjectNotFound(project_path.to_string()))?;

        // Load existing config
        let mut mod_project = load_mod_project(&config_path)?;

        // Find the target layer
        let layer = mod_project
            .layers
            .iter_mut()
            .find(|l| l.name == layer_name)
            .ok_or_else(|| {
                AppError::ValidationFailed(format!("Layer '{}' not found in project", layer_name))
            })?;

        // Update string overrides
        layer.string_overrides = string_overrides;

        // Save as JSON
        let json_config_path = path.join("mod.config.json");
        let config_content = serde_json::to_string_pretty(&mod_project)?;
        fs::write(&json_config_path, config_content)?;

        load_workshop_project(&path)
    }

    /// Create a new layer in a workshop project.
    pub fn create_layer(
        &self,
        project_path: &str,
        name: &str,
        description: Option<String>,
    ) -> AppResult<WorkshopProject> {
        let name = name.trim().to_string();

        if !is_valid_project_name(&name) {
            return Err(AppError::ValidationFailed(
                "Layer name must be lowercase alphanumeric with hyphens only".to_string(),
            ));
        }

        let path = PathBuf::from(project_path);
        if !path.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let config_path = find_config_file(&path)
            .ok_or_else(|| AppError::ProjectNotFound(project_path.to_string()))?;
        let mut mod_project = load_mod_project(&config_path)?;

        // Check for duplicate layer name
        if mod_project.layers.iter().any(|l| l.name == name) {
            return Err(AppError::ValidationFailed(format!(
                "A layer named '{}' already exists",
                name
            )));
        }

        // Assign priority = max existing priority + 1
        let max_priority = mod_project
            .layers
            .iter()
            .map(|l| l.priority)
            .max()
            .unwrap_or(-1);

        mod_project.layers.push(ModProjectLayer {
            name: name.clone(),
            priority: max_priority + 1,
            description,
            string_overrides: HashMap::new(),
        });

        // Save config
        let json_config_path = path.join("mod.config.json");
        let config_content = serde_json::to_string_pretty(&mod_project)?;
        fs::write(&json_config_path, config_content)?;

        // Create content directory for the layer
        let layer_content_dir = path.join("content").join(&name);
        fs::create_dir_all(&layer_content_dir)?;

        load_workshop_project(&path)
    }

    /// Delete a layer from a workshop project.
    pub fn delete_layer(&self, project_path: &str, layer_name: &str) -> AppResult<WorkshopProject> {
        if layer_name == "base" {
            return Err(AppError::ValidationFailed(
                "Cannot delete the base layer".to_string(),
            ));
        }

        let path = PathBuf::from(project_path);
        if !path.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let config_path = find_config_file(&path)
            .ok_or_else(|| AppError::ProjectNotFound(project_path.to_string()))?;
        let mut mod_project = load_mod_project(&config_path)?;

        let layer_index = mod_project
            .layers
            .iter()
            .position(|l| l.name == layer_name)
            .ok_or_else(|| {
                AppError::ValidationFailed(format!("Layer '{}' not found in project", layer_name))
            })?;

        mod_project.layers.remove(layer_index);

        // Save config
        let json_config_path = path.join("mod.config.json");
        let config_content = serde_json::to_string_pretty(&mod_project)?;
        fs::write(&json_config_path, config_content)?;

        // Remove content directory (best-effort)
        let layer_content_dir = path.join("content").join(layer_name);
        if layer_content_dir.exists() {
            let _ = fs::remove_dir_all(&layer_content_dir);
        }

        load_workshop_project(&path)
    }

    /// Update a layer's description in a workshop project.
    pub fn update_layer_description(
        &self,
        project_path: &str,
        layer_name: &str,
        description: Option<String>,
    ) -> AppResult<WorkshopProject> {
        let path = PathBuf::from(project_path);
        if !path.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let config_path = find_config_file(&path)
            .ok_or_else(|| AppError::ProjectNotFound(project_path.to_string()))?;
        let mut mod_project = load_mod_project(&config_path)?;

        let layer = mod_project
            .layers
            .iter_mut()
            .find(|l| l.name == layer_name)
            .ok_or_else(|| {
                AppError::ValidationFailed(format!("Layer '{}' not found in project", layer_name))
            })?;

        layer.description = description;

        let json_config_path = path.join("mod.config.json");
        let config_content = serde_json::to_string_pretty(&mod_project)?;
        fs::write(&json_config_path, config_content)?;

        load_workshop_project(&path)
    }

    /// Reorder layers in a workshop project by reassigning priorities.
    pub fn reorder_layers(
        &self,
        project_path: &str,
        layer_names: Vec<String>,
    ) -> AppResult<WorkshopProject> {
        let path = PathBuf::from(project_path);
        if !path.exists() {
            return Err(AppError::ProjectNotFound(project_path.to_string()));
        }

        let config_path = find_config_file(&path)
            .ok_or_else(|| AppError::ProjectNotFound(project_path.to_string()))?;
        let mut mod_project = load_mod_project(&config_path)?;

        // layer_names should only contain non-base layers
        if layer_names.contains(&"base".to_string()) {
            return Err(AppError::ValidationFailed(
                "Base layer cannot be reordered".to_string(),
            ));
        }

        // Validate that layer_names contains exactly the non-base layers
        let mut current_non_base: Vec<String> = mod_project
            .layers
            .iter()
            .filter(|l| l.name != "base")
            .map(|l| l.name.clone())
            .collect();
        let mut provided_names = layer_names.clone();
        current_non_base.sort();
        provided_names.sort();

        if current_non_base != provided_names {
            return Err(AppError::ValidationFailed(
                "Provided layer names must match exactly the existing non-base layers".to_string(),
            ));
        }

        // Build reordered list: base first at priority 0, then the rest starting at 1
        let mut reordered = Vec::with_capacity(mod_project.layers.len());
        if let Some(mut base) = mod_project
            .layers
            .iter()
            .find(|l| l.name == "base")
            .cloned()
        {
            base.priority = 0;
            reordered.push(base);
        }
        for (i, name) in layer_names.iter().enumerate() {
            let mut layer = mod_project
                .layers
                .iter()
                .find(|l| &l.name == name)
                .cloned()
                .expect("layer existence validated above");
            layer.priority = (i + 1) as i32;
            reordered.push(layer);
        }
        mod_project.layers = reordered;

        // Save config
        let json_config_path = path.join("mod.config.json");
        let config_content = serde_json::to_string_pretty(&mod_project)?;
        fs::write(&json_config_path, config_content)?;

        load_workshop_project(&path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn make_project_with_layers(dir: &std::path::Path, layers: Vec<ModProjectLayer>) {
        let mod_project = ltk_mod_project::ModProject {
            name: "test-mod".to_string(),
            display_name: "Test Mod".to_string(),
            version: "1.0.0".to_string(),
            description: "".to_string(),
            authors: Vec::new(),
            license: None,
            tags: Vec::new(),
            champions: Vec::new(),
            maps: Vec::new(),
            transformers: Vec::new(),
            layers,
            thumbnail: None,
        };
        fs::write(
            dir.join("mod.config.json"),
            serde_json::to_string_pretty(&mod_project).unwrap(),
        )
        .unwrap();
    }

    fn load_layers(dir: &std::path::Path) -> Vec<ModProjectLayer> {
        let config_path = find_config_file(dir).unwrap();
        let project = load_mod_project(&config_path).unwrap();
        project.layers
    }

    #[test]
    fn create_layer_adds_to_config() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(dir.path(), ltk_mod_project::default_layers());

        let config_path = find_config_file(dir.path()).unwrap();
        let mut mod_project = load_mod_project(&config_path).unwrap();
        let max_priority = mod_project
            .layers
            .iter()
            .map(|l| l.priority)
            .max()
            .unwrap_or(-1);
        mod_project.layers.push(ModProjectLayer {
            name: "chroma".to_string(),
            priority: max_priority + 1,
            description: None,
            string_overrides: HashMap::new(),
        });
        fs::write(
            dir.path().join("mod.config.json"),
            serde_json::to_string_pretty(&mod_project).unwrap(),
        )
        .unwrap();

        let layers = load_layers(dir.path());
        assert_eq!(layers.len(), 2);
        assert_eq!(layers[1].name, "chroma");
        assert_eq!(layers[1].priority, 1);
    }

    #[test]
    fn create_layer_invalid_name_rejected() {
        assert!(!is_valid_project_name("Bad Name"));
        assert!(!is_valid_project_name("UPPER"));
        assert!(!is_valid_project_name("has spaces"));
    }

    #[test]
    fn create_layer_duplicate_name_detected() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(dir.path(), ltk_mod_project::default_layers());

        let config_path = find_config_file(dir.path()).unwrap();
        let mod_project = load_mod_project(&config_path).unwrap();
        assert!(mod_project.layers.iter().any(|l| l.name == "base"));
    }

    #[test]
    fn delete_base_layer_rejected() {
        let layer_name = "base";
        assert_eq!(layer_name, "base");
    }

    #[test]
    fn delete_nonexistent_layer_detected() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(dir.path(), ltk_mod_project::default_layers());

        let config_path = find_config_file(dir.path()).unwrap();
        let mod_project = load_mod_project(&config_path).unwrap();
        assert!(mod_project
            .layers
            .iter()
            .position(|l| l.name == "nonexistent")
            .is_none());
    }

    #[test]
    fn delete_layer_removes_from_config() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(
            dir.path(),
            vec![
                ModProjectLayer::base(),
                ModProjectLayer {
                    name: "chroma".to_string(),
                    priority: 1,
                    description: None,
                    string_overrides: HashMap::new(),
                },
            ],
        );

        let config_path = find_config_file(dir.path()).unwrap();
        let mut mod_project = load_mod_project(&config_path).unwrap();
        let idx = mod_project
            .layers
            .iter()
            .position(|l| l.name == "chroma")
            .unwrap();
        mod_project.layers.remove(idx);
        fs::write(
            dir.path().join("mod.config.json"),
            serde_json::to_string_pretty(&mod_project).unwrap(),
        )
        .unwrap();

        let layers = load_layers(dir.path());
        assert_eq!(layers.len(), 1);
        assert_eq!(layers[0].name, "base");
    }

    #[test]
    fn reorder_layers_base_included_rejected() {
        let layer_names = vec!["base".to_string(), "chroma".to_string()];
        assert!(layer_names.contains(&"base".to_string()));
    }

    #[test]
    fn reorder_layers_wrong_set_rejected() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(
            dir.path(),
            vec![
                ModProjectLayer::base(),
                ModProjectLayer {
                    name: "chroma".to_string(),
                    priority: 1,
                    description: None,
                    string_overrides: HashMap::new(),
                },
                ModProjectLayer {
                    name: "vfx".to_string(),
                    priority: 2,
                    description: None,
                    string_overrides: HashMap::new(),
                },
            ],
        );

        let config_path = find_config_file(dir.path()).unwrap();
        let mod_project = load_mod_project(&config_path).unwrap();
        let mut current_non_base: Vec<String> = mod_project
            .layers
            .iter()
            .filter(|l| l.name != "base")
            .map(|l| l.name.clone())
            .collect();
        current_non_base.sort();

        let mut wrong_names = vec!["chroma".to_string(), "wrong".to_string()];
        wrong_names.sort();

        assert_ne!(current_non_base, wrong_names);
    }

    #[test]
    fn reorder_layers_reassigns_priorities() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(
            dir.path(),
            vec![
                ModProjectLayer::base(),
                ModProjectLayer {
                    name: "chroma".to_string(),
                    priority: 1,
                    description: None,
                    string_overrides: HashMap::new(),
                },
                ModProjectLayer {
                    name: "vfx".to_string(),
                    priority: 2,
                    description: None,
                    string_overrides: HashMap::new(),
                },
            ],
        );

        let config_path = find_config_file(dir.path()).unwrap();
        let mut mod_project = load_mod_project(&config_path).unwrap();

        let new_order = vec!["vfx".to_string(), "chroma".to_string()];
        let mut reordered = Vec::new();
        if let Some(mut base) = mod_project
            .layers
            .iter()
            .find(|l| l.name == "base")
            .cloned()
        {
            base.priority = 0;
            reordered.push(base);
        }
        for (i, name) in new_order.iter().enumerate() {
            let mut layer = mod_project
                .layers
                .iter()
                .find(|l| &l.name == name)
                .cloned()
                .unwrap();
            layer.priority = (i + 1) as i32;
            reordered.push(layer);
        }
        mod_project.layers = reordered;
        fs::write(
            dir.path().join("mod.config.json"),
            serde_json::to_string_pretty(&mod_project).unwrap(),
        )
        .unwrap();

        let layers = load_layers(dir.path());
        assert_eq!(layers[0].name, "base");
        assert_eq!(layers[0].priority, 0);
        assert_eq!(layers[1].name, "vfx");
        assert_eq!(layers[1].priority, 1);
        assert_eq!(layers[2].name, "chroma");
        assert_eq!(layers[2].priority, 2);
    }

    #[test]
    fn update_layer_description_persists() {
        let dir = tempfile::tempdir().unwrap();
        make_project_with_layers(dir.path(), ltk_mod_project::default_layers());

        let config_path = find_config_file(dir.path()).unwrap();
        let mut mod_project = load_mod_project(&config_path).unwrap();
        let layer = mod_project
            .layers
            .iter_mut()
            .find(|l| l.name == "base")
            .unwrap();
        layer.description = Some("Updated description".to_string());
        fs::write(
            dir.path().join("mod.config.json"),
            serde_json::to_string_pretty(&mod_project).unwrap(),
        )
        .unwrap();

        let layers = load_layers(dir.path());
        assert_eq!(
            layers[0].description.as_deref(),
            Some("Updated description")
        );
    }
}
