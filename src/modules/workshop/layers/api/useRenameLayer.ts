import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type WorkshopProject } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { workshopKeys } from "../../api/keys";

interface RenameLayerVariables {
  projectPath: string;
  layerName: string;
  newDisplayName: string;
}

export function useRenameLayer() {
  const queryClient = useQueryClient();

  return useMutation<WorkshopProject, AppError, RenameLayerVariables>({
    mutationFn: async ({ projectPath, layerName, newDisplayName }) => {
      const result = await api.renameProjectLayer(projectPath, layerName, newDisplayName);
      return unwrapForQuery(result);
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<WorkshopProject[]>(workshopKeys.projects(), (old) =>
        old?.map((p) => (p.path === updatedProject.path ? updatedProject : p)),
      );
      queryClient.setQueryData(workshopKeys.project(updatedProject.path), updatedProject);
      queryClient.invalidateQueries({
        queryKey: workshopKeys.layerInfo(updatedProject.path),
      });
    },
  });
}
