import { useQuery } from "@tanstack/react-query";
import { convertFileSrc } from "@tauri-apps/api/core";

import { api, type AppError } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

/**
 * Hook to fetch a mod's cached thumbnail as a Tauri asset URL.
 * Returns an empty string if the mod has no thumbnail.
 */
export function useModThumbnail(modId: string) {
  return useQuery<string, AppError>({
    queryKey: libraryKeys.thumbnail(modId),
    queryFn: async () => {
      const result = await api.getModThumbnail(modId);
      const path = unwrapForQuery(result);
      return path ? convertFileSrc(path) : "";
    },
    staleTime: Infinity,
  });
}
