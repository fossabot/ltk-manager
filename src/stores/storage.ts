import { createJSONStorage } from "zustand/middleware";

export const sessionJsonStorage = createJSONStorage(() => sessionStorage, {
  replacer: (_key, value) => {
    if (value instanceof Set) return { __type: "Set", value: [...value] };
    if (value instanceof Map) return { __type: "Map", value: [...value.entries()] };
    return value;
  },
  reviver: (_key, value) => {
    if (value && typeof value === "object" && "__type" in value && "value" in value) {
      const { __type, value: data } = value as { __type: string; value: unknown[] };
      if (__type === "Set") return new Set(data);
      if (__type === "Map") return new Map(data as [unknown, unknown][]);
    }
    return value;
  },
});
