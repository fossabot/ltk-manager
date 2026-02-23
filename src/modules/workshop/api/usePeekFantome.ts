import { useMutation } from "@tanstack/react-query";

import { api, type AppError, type FantomePeekResult } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

export function usePeekFantome() {
  return useMutation<FantomePeekResult, AppError, string>({
    mutationFn: async (filePath) => {
      const result = await api.peekFantome(filePath);
      return unwrapForQuery(result);
    },
  });
}
