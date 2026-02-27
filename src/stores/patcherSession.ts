import { create } from "zustand";

interface TestingProject {
  path: string;
  displayName: string;
}

interface PatcherSessionStore {
  testingProjects: TestingProject[];
  setTestingProjects: (projects: TestingProject[]) => void;
  clearTestingProjects: () => void;
}

export const usePatcherSessionStore = create<PatcherSessionStore>((set) => ({
  testingProjects: [],
  setTestingProjects: (projects) => set({ testingProjects: projects }),
  clearTestingProjects: () => set({ testingProjects: [] }),
}));
