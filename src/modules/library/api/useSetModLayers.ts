import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type InstalledMod } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

interface SetModLayersVariables {
  modId: string;
  layerStates: Record<string, boolean>;
}

export function useSetModLayers() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, SetModLayersVariables, { previous?: InstalledMod[] }>({
    mutationFn: async ({ modId, layerStates }) => {
      const result = await api.setModLayers(modId, layerStates);
      return unwrapForQuery(result);
    },
    onMutate: async ({ modId, layerStates }) => {
      await queryClient.cancelQueries({ queryKey: libraryKeys.mods() });

      const previous = queryClient.getQueryData<InstalledMod[]>(libraryKeys.mods());

      queryClient.setQueryData<InstalledMod[]>(libraryKeys.mods(), (old) =>
        old?.map((mod) =>
          mod.id === modId
            ? {
                ...mod,
                layers: mod.layers.map((layer) => ({
                  ...layer,
                  enabled: layerStates[layer.name] ?? layer.enabled,
                })),
              }
            : mod,
        ),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(libraryKeys.mods(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}
