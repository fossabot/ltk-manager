import { useMemo } from "react";

const DEFAULT_LIMIT = 50;

/**
 * Filter `availableWads` to at most `limit` suggestions that contain the
 * trimmed `draft` (case-insensitive) and aren't in `excluded`.
 *
 * Returns an empty list when `availableWads` is empty. An empty `draft` yields
 * the first `limit` non-excluded WADs in their original order.
 */
export function useWadAutocomplete(
  draft: string,
  availableWads: string[],
  excluded: Set<string>,
  limit: number = DEFAULT_LIMIT,
): string[] {
  return useMemo(() => {
    const q = draft.trim().toLowerCase();
    const pool = availableWads.filter((w) => !excluded.has(w));
    if (!q) return pool.slice(0, limit);
    return pool.filter((w) => w.includes(q)).slice(0, limit);
  }, [draft, availableWads, excluded, limit]);
}
