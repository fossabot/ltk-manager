import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type AppError, type InstalledMod } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

/**
 * Hook to install a mod from a .modpkg file.
 */
export function useInstallMod() {
  const queryClient = useQueryClient();

  return useMutation<InstalledMod, AppError, string>({
    mutationFn: async (filePath) => {
      const result = await api.installMod(filePath);
      return unwrapForQuery(result);
    },
    onSuccess: (newMod) => {
      queryClient.setQueryData<InstalledMod[]>(libraryKeys.mods(), (old) =>
        old ? [newMod, ...old] : [newMod],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.mods() });
    },
  });
}
