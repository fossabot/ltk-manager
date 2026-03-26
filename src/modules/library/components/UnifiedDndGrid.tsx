import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { InstalledMod, LibraryFolder } from "@/lib/tauri";
import { useRootModDnd } from "@/modules/library/api";

import { DroppableFolderCard } from "./DroppableFolderCard";
import { DroppableFolderRow } from "./DroppableFolderRow";
import { FolderCard } from "./FolderCard";
import { FolderRow } from "./FolderRow";
import { ModCard } from "./ModCard";
import { SortableModCard } from "./SortableModCard";

export function gridClass(viewMode: "grid" | "list") {
  if (viewMode === "list") return "space-y-2";
  return "grid grid-cols-[repeat(auto-fill,minmax(var(--card-min-w,240px),var(--card-max-w,320px)))] justify-center gap-4";
}

interface UnifiedDndGridProps {
  folders: LibraryFolder[];
  rootMods: InstalledMod[];
  modsByFolder: Map<string, InstalledMod[]>;
  viewMode: "grid" | "list";
  dndDisabled: boolean;
  onReorder: (modIds: string[]) => void;
  onViewDetails?: (mod: InstalledMod) => void;
}

export function UnifiedDndGrid({
  folders,
  rootMods,
  modsByFolder,
  viewMode,
  dndDisabled,
  onReorder,
  onViewDetails,
}: UnifiedDndGridProps) {
  const {
    localOrder,
    orderedRootMods,
    activeMod,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useRootModDnd({ rootMods, onReorder });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (dndDisabled) {
    return (
      <div className={`${gridClass(viewMode)} stagger-enter`}>
        {folders.map((folder) => {
          const folderMods = modsByFolder.get(folder.id) ?? [];
          if (viewMode === "list") {
            return (
              <FolderRow
                key={folder.id}
                folder={folder}
                mods={folderMods}
                onViewDetails={onViewDetails}
              />
            );
          }
          return <FolderCard key={folder.id} folder={folder} mods={folderMods} />;
        })}
        {rootMods.map((mod) => (
          <ModCard key={mod.id} mod={mod} viewMode={viewMode} onViewDetails={onViewDetails} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={localOrder}
        strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}
      >
        <div className={`${gridClass(viewMode)} stagger-enter`}>
          {folders.map((folder) => {
            const folderMods = modsByFolder.get(folder.id) ?? [];
            if (viewMode === "list") {
              return (
                <DroppableFolderRow
                  key={folder.id}
                  folder={folder}
                  mods={folderMods}
                  onViewDetails={onViewDetails}
                />
              );
            }
            return <DroppableFolderCard key={folder.id} folder={folder} mods={folderMods} />;
          })}

          {orderedRootMods.map((mod) => (
            <SortableModCard
              key={mod.id}
              mod={mod}
              viewMode={viewMode}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeMod && (
          <div className="scale-[1.02] cursor-grabbing rounded-xl shadow-lg ring-2 ring-accent-500/30">
            <ModCard mod={activeMod} viewMode={viewMode} onViewDetails={onViewDetails} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
