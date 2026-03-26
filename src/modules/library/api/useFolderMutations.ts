import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type LibraryFolder } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<LibraryFolder, AppError, string>({
    mutationFn: async (name) => {
      const result = await api.createFolder(name);
      return unwrapForQuery(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.folders() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.folderOrder() });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AppError,
    { folderId: string; newName: string },
    { previous?: LibraryFolder[] }
  >({
    mutationFn: async ({ folderId, newName }) => {
      const result = await api.renameFolder(folderId, newName);
      return unwrapForQuery(result);
    },
    onMutate: async ({ folderId, newName }) => {
      await queryClient.cancelQueries({ queryKey: libraryKeys.folders() });
      const previous = queryClient.getQueryData<LibraryFolder[]>(libraryKeys.folders());
      queryClient.setQueryData<LibraryFolder[]>(libraryKeys.folders(), (old) =>
        old?.map((f) => (f.id === folderId ? { ...f, name: newName } : f)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(libraryKeys.folders(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.folders() });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, string>({
    mutationFn: async (folderId) => {
      const result = await api.deleteFolder(folderId);
      return unwrapForQuery(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.folders() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.folderOrder() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}

export function useToggleFolder() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, { folderId: string; enabled: boolean }>({
    mutationFn: async ({ folderId, enabled }) => {
      const result = await api.toggleFolder(folderId, enabled);
      return unwrapForQuery(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}
