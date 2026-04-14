import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/tauri";
import { queryFnWithArgs } from "@/utils/query";

import { workshopKeys } from "../../api/keys";

export function useLayerInfo(projectPath: string, layerNames: string[]) {
  return useQuery({
    queryKey: [...workshopKeys.layerInfo(projectPath), layerNames],
    queryFn: queryFnWithArgs(api.getLayerInfo, projectPath, layerNames),
  });
}
