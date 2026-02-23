import {
  LuChevronDown,
  LuDownload,
  LuFileArchive,
  LuGitBranch,
  LuGrid3X3,
  LuList,
  LuPackage,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import { Button, IconButton, Menu } from "@/components";

export type ViewMode = "grid" | "list";

interface WorkshopToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onImportModpkg: () => void;
  onImportFantome: () => void;
  onImportGitRepo: () => void;
  onNewProject: () => void;
  isImporting?: boolean;
}

export function WorkshopToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onImportModpkg,
  onImportFantome,
  onImportGitRepo,
  onNewProject,
  isImporting,
}: WorkshopToolbarProps) {
  return (
    <div
      className="flex items-center gap-4 border-b border-surface-600 px-4 py-3"
      data-tauri-drag-region
    >
      {/* Search */}
      <div className="relative flex-1">
        <LuSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2 pr-4 pl-10 text-surface-100 placeholder:text-surface-500 focus:border-transparent focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<LuGrid3X3 className="h-4 w-4" />}
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("grid")}
        />
        <IconButton
          icon={<LuList className="h-4 w-4" />}
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("list")}
        />
      </div>

      {/* Actions */}
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              variant="outline"
              size="sm"
              loading={isImporting}
              left={<LuDownload className="h-4 w-4" />}
              right={<LuChevronDown className="h-3.5 w-3.5" />}
            >
              Import
            </Button>
          }
        />
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item icon={<LuFileArchive className="h-4 w-4" />} onClick={onImportFantome}>
                From Fantome
              </Menu.Item>
              <Menu.Item icon={<LuPackage className="h-4 w-4" />} onClick={onImportModpkg}>
                From Modpkg
              </Menu.Item>
              <Menu.Item icon={<LuGitBranch className="h-4 w-4" />} onClick={onImportGitRepo}>
                From Git Repository
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Button
        variant="filled"
        size="sm"
        onClick={onNewProject}
        left={<LuPlus className="h-4 w-4" />}
      >
        New Project
      </Button>
    </div>
  );
}
