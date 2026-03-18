use crate::error::{AppError, AppResult};
use crate::mods::ModLibrary;
use crate::state::Settings;
use camino::Utf8PathBuf;
use std::path::PathBuf;
use tauri::Emitter;

#[derive(Clone, serde::Serialize, ts_rs::TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub enum OverlayStage {
    Indexing,
    Collecting,
    Patching,
    Strings,
    Complete,
}

/// Progress event emitted during overlay building.
#[derive(Clone, serde::Serialize, ts_rs::TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct OverlayProgress {
    pub stage: OverlayStage,
    pub current_file: Option<String>,
    pub current: u32,
    pub total: u32,
}

/// Ensure the overlay exists and is up-to-date for the current enabled mod set.
///
/// Returns the overlay root directory (the prefix passed to the legacy patcher).
///
/// Workshop project paths (if any) are loaded via `FsModContent` and prepended
/// to the enabled mod list so they take highest priority.
pub fn ensure_overlay(
    library: &ModLibrary,
    settings: &Settings,
    workshop_project_paths: &[PathBuf],
) -> AppResult<PathBuf> {
    let storage_dir = library.storage_dir(settings)?;

    let game_dir = resolve_game_dir(settings)?;

    // Get active profile slug and enabled mods
    let (profile_slug, enabled_mods) = library.get_enabled_mods_for_overlay(settings)?;

    // Use profile-specific overlay and state directories
    let profile_dir = storage_dir.join("profiles").join(profile_slug.as_str());
    let overlay_root = profile_dir.join("overlay");

    tracing::info!("Overlay: storage_dir={}", storage_dir.display());
    tracing::info!("Overlay: profile_slug={}", profile_slug);
    tracing::info!("Overlay: overlay_root={}", overlay_root.display());
    tracing::info!("Overlay: game_dir={}", game_dir.display());

    let enabled_ids = enabled_mods
        .iter()
        .map(|m| m.id.clone())
        .collect::<Vec<_>>();
    tracing::info!(
        "Overlay: enabled_mods={} ids=[{}]",
        enabled_ids.len(),
        enabled_ids.join(", ")
    );

    // Convert to Utf8PathBuf for ltk_overlay API
    let utf8_game_dir = Utf8PathBuf::from_path_buf(game_dir)
        .map_err(|p| AppError::Other(format!("Non-UTF-8 game directory path: {}", p.display())))?;
    let utf8_overlay_root = Utf8PathBuf::from_path_buf(overlay_root.clone())
        .map_err(|p| AppError::Other(format!("Non-UTF-8 overlay root path: {}", p.display())))?;
    let utf8_state_dir = Utf8PathBuf::from_path_buf(profile_dir).map_err(|p| {
        AppError::Other(format!("Non-UTF-8 profile directory path: {}", p.display()))
    })?;

    // Build WAD blocklist from settings
    let mut blocked_wads = Vec::new();
    if !settings.patch_tft {
        blocked_wads.push("map22.wad.client".to_string());
    }

    // Build overlay using ltk_overlay crate
    let app_handle_clone = library.app_handle().clone();
    let mut builder =
        ltk_overlay::OverlayBuilder::new(utf8_game_dir, utf8_overlay_root, utf8_state_dir)
            .with_blocked_wads(blocked_wads)
            .with_progress(move |progress| {
                // Convert ltk_overlay progress to our format
                let stage = match progress.stage {
                    ltk_overlay::OverlayStage::Indexing => OverlayStage::Indexing,
                    ltk_overlay::OverlayStage::CollectingOverrides => OverlayStage::Collecting,
                    ltk_overlay::OverlayStage::PatchingWad => OverlayStage::Patching,
                    ltk_overlay::OverlayStage::ApplyingStringOverrides => OverlayStage::Strings,
                    ltk_overlay::OverlayStage::Complete => OverlayStage::Complete,
                };

                let _ = app_handle_clone.emit(
                    "overlay-progress",
                    OverlayProgress {
                        stage,
                        current_file: progress.current_file,
                        current: progress.current,
                        total: progress.total,
                    },
                );
            });

    let mut all_mods = Vec::new();
    for project_path in workshop_project_paths {
        let utf8_path = Utf8PathBuf::from_path_buf(project_path.clone()).map_err(|p| {
            AppError::Other(format!("Non-UTF-8 workshop project path: {}", p.display()))
        })?;
        let dir_name = project_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");
        let id = format!("workshop:{}", dir_name);
        tracing::info!("Adding workshop project: id={}, path={}", id, utf8_path);
        all_mods.push(ltk_overlay::EnabledMod {
            id,
            content: Box::new(ltk_overlay::FsModContent::new(utf8_path)),
            enabled_layers: None,
        });
    }
    all_mods.extend(enabled_mods);
    builder.set_enabled_mods(all_mods);

    builder
        .build()
        .map_err(|e| AppError::Other(format!("Overlay build failed: {}", e)))?;

    Ok(overlay_root)
}

fn resolve_game_dir(settings: &Settings) -> AppResult<PathBuf> {
    let league_root = settings
        .league_path
        .clone()
        .ok_or_else(|| AppError::ValidationFailed("League path is not configured".to_string()))?;

    // Users might configure either the install root (…/League of Legends) or the Game dir (…/League of Legends/Game).
    // Accept both.
    let game_dir = league_root.join("Game");
    if game_dir.exists() {
        return Ok(game_dir);
    }
    if league_root.join("DATA").exists() {
        return Ok(league_root);
    }

    Err(AppError::ValidationFailed(format!(
        "League path does not look like an install root or a Game directory: {}",
        league_root.display()
    )))
}

#[cfg(test)]
mod tests {
    use super::*;
    use assert_matches::assert_matches;

    #[test]
    fn resolve_game_dir_no_league_path() {
        let settings = Settings::default();
        assert_matches!(
            resolve_game_dir(&settings),
            Err(AppError::ValidationFailed(_))
        );
    }

    #[test]
    fn resolve_game_dir_with_game_subdir() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(dir.path().join("Game")).unwrap();

        let settings = Settings {
            league_path: Some(dir.path().to_path_buf()),
            ..Settings::default()
        };
        let result = resolve_game_dir(&settings).unwrap();
        assert!(result.ends_with("Game"));
    }

    #[test]
    fn resolve_game_dir_with_data_dir() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(dir.path().join("DATA")).unwrap();

        let settings = Settings {
            league_path: Some(dir.path().to_path_buf()),
            ..Settings::default()
        };
        let result = resolve_game_dir(&settings).unwrap();
        assert_eq!(result, dir.path().to_path_buf());
    }

    #[test]
    fn resolve_game_dir_neither_dir() {
        let dir = tempfile::tempdir().unwrap();
        let settings = Settings {
            league_path: Some(dir.path().to_path_buf()),
            ..Settings::default()
        };
        assert_matches!(
            resolve_game_dir(&settings),
            Err(AppError::ValidationFailed(_))
        );
    }

    #[test]
    fn overlay_stage_serialization() {
        assert_eq!(
            serde_json::to_string(&OverlayStage::Indexing).unwrap(),
            "\"indexing\""
        );
        assert_eq!(
            serde_json::to_string(&OverlayStage::Collecting).unwrap(),
            "\"collecting\""
        );
        assert_eq!(
            serde_json::to_string(&OverlayStage::Patching).unwrap(),
            "\"patching\""
        );
        assert_eq!(
            serde_json::to_string(&OverlayStage::Strings).unwrap(),
            "\"strings\""
        );
        assert_eq!(
            serde_json::to_string(&OverlayStage::Complete).unwrap(),
            "\"complete\""
        );
    }

    #[test]
    fn overlay_progress_serialization() {
        let progress = OverlayProgress {
            stage: OverlayStage::Patching,
            current_file: Some("test.wad.client".to_string()),
            current: 5,
            total: 10,
        };
        let json = serde_json::to_value(&progress).unwrap();
        assert_eq!(json["stage"], "patching");
        assert_eq!(json["currentFile"], "test.wad.client");
        assert_eq!(json["current"], 5);
        assert_eq!(json["total"], 10);
    }
}
