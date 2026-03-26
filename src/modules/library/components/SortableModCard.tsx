import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CSSProperties } from "react";

import type { InstalledMod } from "@/lib/tauri";
import { usePatcherStatus } from "@/modules/patcher";

import { ModCard } from "./ModCard";

interface SortableModCardProps {
  mod: InstalledMod;
  viewMode: "grid" | "list";
  onViewDetails?: (mod: InstalledMod) => void;
}

export function SortableModCard({ mod, viewMode, onViewDetails }: SortableModCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });
  const { data: patcherStatus } = usePatcherStatus();
  const disabled = patcherStatus?.running ?? false;

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? "transform 250ms cubic-bezier(0.25, 1, 0.5, 1)",
    willChange: transform ? "transform" : undefined,
  };

  if (viewMode === "list") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group/sortable relative flex items-center gap-0 rounded-xl ${isDragging ? "z-0" : ""}`}
      >
        {isDragging && (
          <div className="absolute inset-0 rounded-xl border-2 border-dashed border-accent-500/40 bg-accent-500/5" />
        )}
        {!disabled && (
          <div
            className={`flex shrink-0 items-center px-2 py-3 text-surface-500 opacity-0 transition-opacity group-hover/sortable:opacity-100 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            data-no-toggle
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        <div className={`min-w-0 flex-1 ${isDragging ? "invisible" : ""}`}>
          <ModCard mod={mod} viewMode={viewMode} onViewDetails={onViewDetails} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/sortable relative h-full rounded-xl ${isDragging ? "z-0" : ""}`}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      {isDragging && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-accent-500/40 bg-accent-500/5" />
      )}
      <div className={`h-full ${isDragging ? "invisible" : ""}`}>
        <ModCard mod={mod} viewMode={viewMode} onViewDetails={onViewDetails} />
      </div>
    </div>
  );
}
