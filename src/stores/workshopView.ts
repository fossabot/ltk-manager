import { create } from "zustand";

import type { ViewMode } from "@/modules/workshop";

interface WorkshopViewStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useWorkshopViewStore = create<WorkshopViewStore>((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
