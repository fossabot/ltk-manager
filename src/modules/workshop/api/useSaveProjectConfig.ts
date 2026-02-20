import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type SaveProjectConfigArgs, type WorkshopProject } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { workshopKeys } from "./keys";

/**
 * Hook to save project configuration changes.
 */
export function useSaveProjectConfig() {
  const queryClient = useQueryClient();

  return useMutation<WorkshopProject, AppError, SaveProjectConfigArgs>({
    mutationFn: async (args) => {
      const result = await api.saveProjectConfig(args);
      return unwrapForQuery(result);
    },
    onSuccess: (updatedProject) => {
      // Update the project in the projects list
      queryClient.setQueryData<WorkshopProject[]>(workshopKeys.projects(), (old) =>
        old?.map((p) => (p.path === updatedProject.path ? updatedProject : p)),
      );
      // Update the individual project cache
      queryClient.setQueryData(workshopKeys.project(updatedProject.path), updatedProject);
    },
  });
}
