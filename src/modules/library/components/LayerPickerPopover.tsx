import { useState } from "react";

import { Button, Popover, Switch } from "@/components";
import type { ModLayer } from "@/lib/tauri";

import { LayerToggleList } from "./LayerToggleList";

interface LayerPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modName: string;
  layers: ModLayer[];
  switchSize?: "sm" | "md";
  switchClassName?: string;
  switchChecked: boolean;
  onConfirm: (layerStates: Record<string, boolean>) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function LayerPickerPopover({
  open,
  onOpenChange,
  modName,
  layers,
  switchSize = "md",
  switchClassName,
  switchChecked,
  onConfirm,
  onCancel,
  disabled,
}: LayerPickerPopoverProps) {
  const [localStates, setLocalStates] = useState<Record<string, boolean>>(() => {
    const states: Record<string, boolean> = {};
    for (const layer of layers) {
      states[layer.name] = true;
    }
    return states;
  });

  const localLayers: ModLayer[] = layers.map((l) => ({
    ...l,
    enabled: localStates[l.name] ?? true,
  }));

  function handleToggle(layerName: string, enabled: boolean) {
    setLocalStates((prev) => ({ ...prev, [layerName]: enabled }));
  }

  function handleConfirm() {
    onConfirm(localStates);
    onOpenChange(false);
  }

  function handleCancel() {
    onCancel();
    onOpenChange(false);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleCancel();
        else onOpenChange(true);
      }}
    >
      <Popover.Trigger
        render={<button type="button" className="appearance-none border-0 bg-transparent p-0" />}
      >
        <Switch
          size={switchSize}
          disabled={disabled}
          checked={switchChecked}
          className={switchClassName}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8}>
          <Popover.Popup className="w-72 p-3">
            <Popover.Arrow />
            <Popover.Title className="mb-1">{modName}</Popover.Title>
            <p className="mb-3 text-xs text-surface-400">Choose which layers to enable.</p>
            <LayerToggleList layers={localLayers} onToggle={handleToggle} />
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" variant="filled" onClick={handleConfirm}>
                Enable
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
