import { useQuery } from "@tanstack/react-query";

import { api, type AppError } from "@/lib/tauri";
import { queryFn } from "@/utils/query";

import { settingsKeys } from "./keys";

/**
 * Hook to fetch every WAD filename under the configured League install's `DATA`
 * directory. Used by the blocklist editor for autocomplete and regex previews.
 *
 * The WAD set is effectively static for a given install, so we keep the data
 * fresh for an hour; invalidate `settingsKeys.availableWads()` when the league
 * path changes.
 */
export function useAvailableWads() {
  return useQuery<string[], AppError>({
    queryKey: settingsKeys.availableWads(),
    queryFn: queryFn(api.listAvailableWads),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
