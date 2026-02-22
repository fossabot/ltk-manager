import type { NavigateFn } from "@tanstack/react-router";
import { useState } from "react";

import { api, type PackResult, type WorkshopProject } from "@/lib/tauri";

import { useDeleteProject } from "./useDeleteProject";
import { usePackProject } from "./usePackProject";
import { useValidateProject } from "./useValidateProject";

export function useProjectActions(project: WorkshopProject | undefined, navigate: NavigateFn) {
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packResult, setPackResult] = useState<PackResult | null>(null);

  const deleteProject = useDeleteProject();
  const packProject = usePackProject();
  const { data: validation, isLoading: validationLoading } = useValidateProject(
    project?.path ?? "",
    packDialogOpen,
  );

  function handlePack(format: "modpkg" | "fantome") {
    if (!project) return;
    packProject.mutate(
      { projectPath: project.path, format },
      {
        onSuccess: setPackResult,
        onError: (err) => console.error("Failed to pack project:", err.message),
      },
    );
  }

  function handleOpenPackDialog() {
    setPackResult(null);
    setPackDialogOpen(true);
  }

  function handleClosePackDialog() {
    setPackDialogOpen(false);
    setPackResult(null);
  }

  function handleDeleteProject() {
    if (!project) return;
    deleteProject.mutate(project.path, {
      onSuccess: () => {
        navigate({ to: "/workshop" });
      },
      onError: (err) => console.error("Failed to delete project:", err.message),
    });
  }

  function openDeleteDialog() {
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false);
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
    packDialogOpen,
    packResult,
    deleteDialogOpen,
    validation: validation ?? null,
    validationLoading,
    isPacking: packProject.isPending,
    isDeleting: deleteProject.isPending,
    handlePack,
    handleOpenPackDialog,
    handleClosePackDialog,
    handleDeleteProject,
    handleOpenLocation,
    openDeleteDialog,
    closeDeleteDialog,
  };
}
