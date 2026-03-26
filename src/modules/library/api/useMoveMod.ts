import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

export function useMoveModToFolder() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, { modId: string; folderId: string }>({
    mutationFn: async ({ modId, folderId }) => {
      const result = await api.moveModToFolder(modId, folderId);
      return unwrapForQuery(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.folders() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}

export function useReorderFolderMods() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, { folderId: string; modIds: string[] }>({
    mutationFn: async ({ folderId, modIds }) => {
      const result = await api.reorderFolderMods(folderId, modIds);
      return unwrapForQuery(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.folders() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}

export function useReorderFolders() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, string[]>({
    mutationFn: async (folderOrder) => {
      const result = await api.reorderFolders(folderOrder);
      return unwrapForQuery(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.folderOrder() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}
