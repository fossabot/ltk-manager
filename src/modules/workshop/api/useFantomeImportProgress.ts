import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

import type { FantomeImportProgress } from "@/lib/tauri";

export function useFantomeImportProgress() {
  const [progress, setProgress] = useState<FantomeImportProgress | null>(null);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    listen<FantomeImportProgress>("fantome-import-progress", (event) => {
      setProgress(event.payload);

      if (event.payload.stage === "complete" || event.payload.stage === "error") {
        setTimeout(() => setProgress(null), 1000);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return progress;
}
