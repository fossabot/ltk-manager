import { useQueryClient } from "@tanstack/react-query";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect } from "react";

import { libraryKeys } from "./keys";

/**
 * Listen for `library-changed` events from the backend file watcher
 * and invalidate all library queries so the UI stays in sync.
 */
export function useLibraryWatcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    let mounted = true;

    listen("library-changed", () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    }).then((fn) => {
      if (!mounted) {
        fn();
        return;
      }
      unlisten = fn;
    });

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
  }, [queryClient]);
}
