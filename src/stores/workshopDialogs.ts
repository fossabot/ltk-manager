import { create } from "zustand";

import type { FantomePeekResult, WorkshopProject } from "@/lib/tauri";

interface WorkshopDialogsStore {
  packProject: WorkshopProject | null;
  deleteProject: WorkshopProject | null;
  newProjectOpen: boolean;
  fantomeImport: { peekResult: FantomePeekResult; filePath: string } | null;
  gitImportOpen: boolean;

  openPackDialog: (project: WorkshopProject) => void;
  closePackDialog: () => void;
  openDeleteDialog: (project: WorkshopProject) => void;
  closeDeleteDialog: () => void;
  openNewProjectDialog: () => void;
  closeNewProjectDialog: () => void;
  openFantomeImportDialog: (peekResult: FantomePeekResult, filePath: string) => void;
  closeFantomeImportDialog: () => void;
  openGitImportDialog: () => void;
  closeGitImportDialog: () => void;
}

export const useWorkshopDialogsStore = create<WorkshopDialogsStore>((set) => ({
  packProject: null,
  deleteProject: null,
  newProjectOpen: false,
  fantomeImport: null,
  gitImportOpen: false,

  openPackDialog: (project) => set({ packProject: project }),
  closePackDialog: () => set({ packProject: null }),
  openDeleteDialog: (project) => set({ deleteProject: project }),
  closeDeleteDialog: () => set({ deleteProject: null }),
  openNewProjectDialog: () => set({ newProjectOpen: true }),
  closeNewProjectDialog: () => set({ newProjectOpen: false }),
  openFantomeImportDialog: (peekResult, filePath) =>
    set({ fantomeImport: { peekResult, filePath } }),
  closeFantomeImportDialog: () => set({ fantomeImport: null }),
  openGitImportDialog: () => set({ gitImportOpen: true }),
  closeGitImportDialog: () => set({ gitImportOpen: false }),
}));
