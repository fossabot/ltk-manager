import type { InstalledMod, LibraryFolder } from "@/lib/tauri";
import { getFolderEnabledState } from "@/modules/library/utils";
import { usePatcherStatus } from "@/modules/patcher";

import { useToggleFolder } from "./useFolderMutations";

export function useFolderToggle(folder: LibraryFolder, mods: InstalledMod[]) {
  const toggleFolder = useToggleFolder();
  const { data: patcherStatus } = usePatcherStatus();
  const isPatcherActive = patcherStatus?.running ?? false;
  const { checked, indeterminate } = getFolderEnabledState(mods);

  const handleToggle = () => {
    if (isPatcherActive || mods.length === 0) return;
    toggleFolder.mutate({
      folderId: folder.id,
      enabled: !checked,
    });
  };

  return { handleToggle, checked, indeterminate };
}
