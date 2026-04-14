import { EllipsisVertical, FolderOpen, Lock, Pencil } from "lucide-react";

import { IconButton, Menu, Tooltip } from "@/components";
import { api, type WorkshopLayer, type WorkshopLayerInfo } from "@/lib/tauri";

import { getStringOverrideCount, WadFilesBadge } from "./LayerCard";

interface LockedLayerCardProps {
  layer: WorkshopLayer;
  projectPath: string;
  layerInfo?: WorkshopLayerInfo;
  onEdit: () => void;
}

export function LockedLayerCard({ layer, projectPath, layerInfo, onEdit }: LockedLayerCardProps) {
  const stringOverrideCount = getStringOverrideCount(layer);

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex shrink-0 items-center">
        <Lock className="h-4 w-4 text-surface-600" />
      </div>

      <div className="min-w-0 flex-1 rounded-lg border border-surface-700 bg-surface-800/50 p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Tooltip content={layer.name} side="bottom">
                <h3 className="font-medium text-surface-100">{layer.displayName}</h3>
              </Tooltip>
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
                  <Menu.Item icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
                    Edit
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
