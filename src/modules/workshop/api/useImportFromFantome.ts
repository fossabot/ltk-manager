import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type ImportFantomeArgs, type WorkshopProject } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { workshopKeys } from "./keys";

export function useImportFromFantome() {
  const queryClient = useQueryClient();

  return useMutation<WorkshopProject, AppError, ImportFantomeArgs>({
    mutationFn: async (args) => {
      const result = await api.importFromFantome(args);
      return unwrapForQuery(result);
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData<WorkshopProject[]>(workshopKeys.projects(), (old) =>
        old ? [newProject, ...old] : [newProject],
      );
    },
  });
}
