import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type ImportGitRepoArgs, type WorkshopProject } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { workshopKeys } from "./keys";

export function useImportFromGitRepo() {
  const queryClient = useQueryClient();

  return useMutation<WorkshopProject, AppError, ImportGitRepoArgs>({
    mutationFn: async (args) => {
      const result = await api.importFromGitRepo(args);
      return unwrapForQuery(result);
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData<WorkshopProject[]>(workshopKeys.projects(), (old) =>
        old ? [newProject, ...old] : [newProject],
      );
    },
  });
}
