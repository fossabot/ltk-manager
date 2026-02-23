import { useEffect, useRef } from "react";

import type { OverlayProgress } from "@/lib/tauri";
import { useTauriProgress } from "@/lib/useTauriProgress";

import { usePatcherStatus } from "./usePatcherStatus";

const TERMINAL_STAGES = ["complete"];

export function useOverlayProgress() {
  const { progress, clear } = useTauriProgress<OverlayProgress>("overlay-progress", {
    terminalStages: TERMINAL_STAGES,
  });
  const { data: patcherStatus } = usePatcherStatus();
  const wasPatcherRunning = useRef(false);

  useEffect(() => {
    const isPatcherRunning = patcherStatus?.running ?? false;

    if (wasPatcherRunning.current && !isPatcherRunning) {
      clear();
    }

    wasPatcherRunning.current = isPatcherRunning;
  }, [patcherStatus?.running, clear]);

  return progress;
}
