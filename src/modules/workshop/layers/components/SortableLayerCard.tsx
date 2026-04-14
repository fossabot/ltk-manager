import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  EllipsisVertical,
  FolderOpen,
  GripVertical,
  Pencil,
  TextCursorInput,
  Trash2,
} from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";

import { IconButton, Menu, Tooltip } from "@/components";
import { api, type WorkshopLayer, type WorkshopLayerInfo } from "@/lib/tauri";
import { useRenameLayer } from "@/modules/workshop";

import { getStringOverrideCount, WadFilesBadge } from "./LayerCard";

interface SortableLayerCardProps {
  layer: WorkshopLayer;
  projectPath: string;
  layerInfo?: WorkshopLayerInfo;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLayerCard({
  layer,
  projectPath,
  layerInfo,
  onEdit,
  onDelete,
}: SortableLayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.name,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const stringOverrideCount = getStringOverrideCount(layer);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const renameLayer = useRenameLayer();

  function startRename() {
    setRenameValue(layer.displayName);
    setIsRenaming(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === layer.displayName) {
      setIsRenaming(false);
      return;
    }
    renameLayer.mutate(
      { projectPath, layerName: layer.name, newDisplayName: trimmed },
      { onSettled: () => setIsRenaming(false) },
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="group/sortable relative flex items-center gap-2">
      <div
        className="flex shrink-0 cursor-grab items-center opacity-0 transition-opacity group-hover/sortable:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-surface-500" />
      </div>

      <div className="min-w-0 flex-1 rounded-lg border border-surface-700 bg-surface-800/50 p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  className="min-w-0 flex-1 rounded border border-surface-600 bg-surface-900 px-2 py-0.5 text-sm font-medium text-surface-100 outline-none focus:border-accent-500"
                />
              ) : (
                <Tooltip content={layer.name} side="bottom">
                  <h3
                    className="cursor-pointer font-medium text-surface-100"
                    onDoubleClick={startRename}
                  >
                    {layer.displayName}
                  </h3>
                </Tooltip>
              )}
              <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400">
                Priority {layer.priority}
              </span>
              <WadFilesBadge layerInfo={layerInfo} />
            </div>
            {layer.description && (
              <p className="mt-1 text-sm text-surface-400">{layer.description}</p>
            )}
            {layerInfo && layerInfo.wadFiles.length === 0 && (
              <p className="mt-1.5 text-xs text-surface-500">
                No content yet - add WAD files to this layer&apos;s folder to get started.
              </p>
            )}
          </div>

          {stringOverrideCount > 0 && (
            <span className="shrink-0 text-xs text-surface-400">
              {stringOverrideCount} string override{stringOverrideCount !== 1 ? "s" : ""}
            </span>
          )}

          <Menu.Root>
            <Menu.Trigger
              render={
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<EllipsisVertical className="h-4 w-4" />}
                />
              }
            />
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={4}>
                <Menu.Popup>
                  <Menu.Item
                    icon={<FolderOpen className="h-4 w-4" />}
                    onClick={async () => {
                      const result = await api.getLayerContentPath(projectPath, layer.name);
                      if (result.ok) api.revealInExplorer(result.value);
                    }}
                  >
                    Open Folder
                  </Menu.Item>
                  <Menu.Item icon={<TextCursorInput className="h-4 w-4" />} onClick={startRename}>
                    Rename
                  </Menu.Item>
                  <Menu.Item icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
                    Edit
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="danger"
                    onClick={onDelete}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </div>
  );
}
