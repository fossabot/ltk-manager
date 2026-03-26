import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FolderOutput } from "lucide-react";

import type { InstalledMod } from "@/lib/tauri";
import { useSortableModDnd } from "@/modules/library/api";

import { ModCard } from "./ModCard";
import { SortableModCard } from "./SortableModCard";

const REMOVE_FROM_FOLDER_ID = "remove-from-folder";

/**
 * Checks pointer-within for the remove zone first; if the pointer is
 * inside it, that wins. Otherwise falls back to closestCenter for
 * normal sortable reordering.
 */
const removeZoneFirstCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const removeHit = pointerCollisions.find((c) => c.id === REMOVE_FROM_FOLDER_ID);
  if (removeHit) return [removeHit];
  return closestCenter(args);
};

interface SortableModListProps {
  mods: InstalledMod[];
  viewMode: "grid" | "list";
  onReorder: (modIds: string[]) => void;
  disabled?: boolean;
  onViewDetails?: (mod: InstalledMod) => void;
  className?: string;
  folderId?: string;
}

export function SortableModList({
  mods,
  viewMode,
  onReorder,
  disabled,
  onViewDetails,
  className,
  folderId,
}: SortableModListProps) {
  const {
    localOrder,
    orderedMods,
    activeId,
    activeMod,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useSortableModDnd({ mods, onReorder, folderId });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (disabled) {
    return (
      <div className={className}>
        {mods.map((mod) => (
          <ModCard key={mod.id} mod={mod} viewMode={viewMode} onViewDetails={onViewDetails} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={folderId ? removeZoneFirstCollision : closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={localOrder}
        strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}
      >
        {folderId && <RemoveFromFolderZone visible={!!activeId} />}
        <div className={className}>
          {orderedMods.map((mod) => (
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

function RemoveFromFolderZone({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: REMOVE_FROM_FOLDER_ID });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ease-out ${
        visible ? "mb-4 max-h-14 p-4 opacity-100" : "max-h-0 border-transparent p-0 opacity-0"
      } ${
        isOver ? "border-red-500 bg-red-500/10 text-red-400" : "border-surface-600 text-surface-400"
      }`}
    >
      <FolderOutput className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium whitespace-nowrap">Drop here to remove from folder</span>
    </div>
  );
}
