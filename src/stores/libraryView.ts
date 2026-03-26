import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LibraryViewStore {
  expandedFolders: Set<string>;

  toggleFolderExpanded: (folderId: string) => void;
  cleanupStaleFolders: (validFolderIds: Set<string>) => void;
}

export const useLibraryViewStore = create<LibraryViewStore>()(
  persist(
    (set) => ({
      expandedFolders: new Set<string>(),

      toggleFolderExpanded: (folderId) =>
        set((state) => {
          const next = new Set(state.expandedFolders);
          if (next.has(folderId)) next.delete(folderId);
          else next.add(folderId);
          return { expandedFolders: next };
        }),

      cleanupStaleFolders: (validFolderIds) =>
        set((state) => {
          const next = new Set<string>();
          for (const id of state.expandedFolders) {
            if (validFolderIds.has(id)) next.add(id);
          }
          return { expandedFolders: next };
        }),
    }),
    {
      name: "ltk-library-view",
      partialize: (state) => ({
        expandedFolders: state.expandedFolders,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed?.state?.expandedFolders) {
            parsed.state.expandedFolders = new Set(parsed.state.expandedFolders);
          }
          return parsed;
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              expandedFolders: [...(value.state.expandedFolders ?? [])],
            },
          };
          localStorage.setItem(name, JSON.stringify(serializable));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
