import { FileArchive } from "lucide-react";

import { Popover } from "@/components";
import type { WorkshopLayer, WorkshopLayerInfo } from "@/lib/tauri";

export function getStringOverrideCount(layer: WorkshopLayer): number {
  return Object.values(layer.stringOverrides).reduce(
    (sum, localeOverrides) => sum + Object.keys(localeOverrides).length,
    0,
  );
}

export function WadFilesBadge({ layerInfo }: { layerInfo?: WorkshopLayerInfo }) {
  if (!layerInfo || layerInfo.wadFiles.length === 0) return null;

  const count = layerInfo.wadFiles.length;

  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        render={
          <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400">
            <FileArchive className="h-3 w-3" />
            {count} WAD{count !== 1 ? "s" : ""}
          </span>
        }
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={6}>
          <Popover.Popup className="p-3">
            <p className="mb-2 text-xs font-medium text-surface-300">Modified WAD files</p>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {layerInfo.wadFiles.map((name) => (
                <li key={name} className="text-xs text-surface-400">
                  {name}
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function LayerCard({ layer }: { layer: WorkshopLayer }) {
  const stringOverrideCount = getStringOverrideCount(layer);

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/50 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-surface-100">{layer.displayName}</h3>
            <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400">
              Priority {layer.priority}
            </span>
          </div>
          {layer.description && (
            <p className="mt-1 text-sm text-surface-400">{layer.description}</p>
          )}
        </div>
        {stringOverrideCount > 0 && (
          <span className="shrink-0 text-xs text-surface-400">
            {stringOverrideCount} string override{stringOverrideCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
