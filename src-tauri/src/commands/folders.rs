use crate::error::{AppResult, IpcResult, MutexResultExt};
use crate::mods::{LibraryFolder, ModLibraryState};
use crate::patcher::PatcherState;
use crate::state::SettingsState;
use tauri::State;

use super::mods::reject_if_patcher_running;

#[tauri::command]
pub fn get_folders(
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
) -> IpcResult<Vec<LibraryFolder>> {
    let result: AppResult<Vec<LibraryFolder>> = (|| {
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.get_folders(&settings)
    })();
    result.into()
}

#[tauri::command]
pub fn get_folder_order(
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
) -> IpcResult<Vec<String>> {
    let result: AppResult<Vec<String>> = (|| {
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.get_folder_order(&settings)
    })();
    result.into()
}

#[tauri::command]
pub fn create_folder(
    name: String,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
) -> IpcResult<LibraryFolder> {
    let result: AppResult<LibraryFolder> = (|| {
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.create_folder(&settings, &name)
    })();
    result.into()
}

#[tauri::command]
pub fn rename_folder(
    folder_id: String,
    new_name: String,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
) -> IpcResult<()> {
    let result: AppResult<()> = (|| {
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.rename_folder(&settings, &folder_id, &new_name)
    })();
    result.into()
}

#[tauri::command]
pub fn delete_folder(
    folder_id: String,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
) -> IpcResult<()> {
    let result: AppResult<()> = (|| {
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.delete_folder(&settings, &folder_id)
    })();
    result.into()
}

#[tauri::command]
pub fn move_mod_to_folder(
    mod_id: String,
    folder_id: String,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
) -> IpcResult<()> {
    let result: AppResult<()> = (|| {
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.move_mod_to_folder(&settings, &mod_id, &folder_id)
    })();
    result.into()
}

#[tauri::command]
pub fn toggle_folder(
    folder_id: String,
    enabled: bool,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
    patcher: State<PatcherState>,
) -> IpcResult<()> {
    let result: AppResult<()> = (|| {
        reject_if_patcher_running(&patcher)?;
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.toggle_folder(&settings, &folder_id, enabled)
    })();
    result.into()
}

#[tauri::command]
pub fn reorder_folder_mods(
    folder_id: String,
    mod_ids: Vec<String>,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
    patcher: State<PatcherState>,
) -> IpcResult<()> {
    let result: AppResult<()> = (|| {
        reject_if_patcher_running(&patcher)?;
        let settings = settings.0.lock().mutex_err()?.clone();
        library
            .0
            .reorder_folder_mods(&settings, &folder_id, mod_ids)
    })();
    result.into()
}

#[tauri::command]
pub fn reorder_folders(
    folder_order: Vec<String>,
    library: State<ModLibraryState>,
    settings: State<SettingsState>,
    patcher: State<PatcherState>,
) -> IpcResult<()> {
    let result: AppResult<()> = (|| {
        reject_if_patcher_running(&patcher)?;
        let settings = settings.0.lock().mutex_err()?.clone();
        library.0.reorder_folders(&settings, folder_order)
    })();
    result.into()
}
