import { api, type WorkshopProject } from "@/lib/tauri";
import { useWorkshopDialogsStore } from "@/stores";

import { useTestProjects } from "./useTestProject";

export function useProjectActions(project: WorkshopProject | undefined) {
  const testProjects = useTestProjects();
  const openPackDialog = useWorkshopDialogsStore((s) => s.openPackDialog);
  const openDeleteDialog = useWorkshopDialogsStore((s) => s.openDeleteDialog);

  function handleTestProject() {
    if (!project) return;
    testProjects.mutate(
      { projects: [{ path: project.path, displayName: project.displayName }] },
      { onError: (err) => console.error("Failed to test project:", err.message) },
    );
  }

  function handleOpenPackDialog() {
    if (!project) return;
    openPackDialog(project);
  }

  function handleOpenDeleteDialog() {
    if (!project) return;
    openDeleteDialog(project);
  }

  async function handleOpenLocation() {
    if (!project) return;
    try {
      await api.revealInExplorer(project.path);
    } catch (error) {
      console.error("Failed to open location:", error);
    }
  }

  return {
    isTesting: testProjects.isPending,
    handleTestProject,
    handleOpenPackDialog,
    handleOpenDeleteDialog,
    handleOpenLocation,
  };
}
