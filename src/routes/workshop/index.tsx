import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

import type {
  CreateProjectArgs,
  FantomePeekResult,
  ImportFantomeArgs,
  ImportGitRepoArgs,
  PackResult,
  WorkshopProject,
} from "@/lib/tauri";
import type { ViewMode } from "@/modules/workshop";
import {
  DeleteConfirmDialog,
  ErrorState,
  ImportFantomeDialog,
  ImportGitRepoDialog,
  LoadingState,
  NewProjectDialog,
  NoProjectsState,
  NoSearchResultsState,
  PackDialog,
  ProjectGrid,
  useCreateProject,
  useDeleteProject,
  useFantomeImportProgress,
  useGitImportProgress,
  useImportFromFantome,
  useImportFromGitRepo,
  useImportFromModpkg,
  usePackProject,
  usePeekFantome,
  useValidateProject,
  useWorkshopProjects,
  WorkshopToolbar,
} from "@/modules/workshop";

export const Route = createFileRoute("/workshop/")({
  component: WorkshopIndex,
});

function WorkshopIndex() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Dialog state
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<WorkshopProject | null>(null);
  const [packResult, setPackResult] = useState<PackResult | null>(null);

  // Fantome import state
  const [fantomeDialogOpen, setFantomeDialogOpen] = useState(false);
  const [fantomePeek, setFantomePeek] = useState<FantomePeekResult | null>(null);
  const [fantomeFilePath, setFantomeFilePath] = useState<string | null>(null);

  // Git repo import state
  const [gitRepoDialogOpen, setGitRepoDialogOpen] = useState(false);

  // API hooks
  const { data: projects = [], isLoading, error } = useWorkshopProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const packProject = usePackProject();
  const importFromModpkg = useImportFromModpkg();
  const peekFantome = usePeekFantome();
  const importFromFantome = useImportFromFantome();
  const fantomeProgress = useFantomeImportProgress();
  const importFromGitRepo = useImportFromGitRepo();
  const gitImportProgress = useGitImportProgress();

  const { data: validation, isLoading: validationLoading } = useValidateProject(
    selectedProject?.path ?? "",
    packDialogOpen,
  );

  const filteredProjects = projects.filter(
    (project) =>
      project.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleCreateProject(args: CreateProjectArgs) {
    createProject.mutate(args, {
      onSuccess: () => setNewProjectOpen(false),
      onError: (err) => console.error("Failed to create project:", err.message),
    });
  }

  function handleEditProject(project: WorkshopProject) {
    navigate({ to: "/workshop/$projectName", params: { projectName: project.name } });
  }

  function handleOpenPackDialog(project: WorkshopProject) {
    setSelectedProject(project);
    setPackResult(null);
    setPackDialogOpen(true);
  }

  function handlePack(format: "modpkg" | "fantome") {
    if (!selectedProject) return;
    packProject.mutate(
      { projectPath: selectedProject.path, format },
      {
        onSuccess: setPackResult,
        onError: (err) => console.error("Failed to pack project:", err.message),
      },
    );
  }

  function handleClosePackDialog() {
    setPackDialogOpen(false);
    setSelectedProject(null);
    setPackResult(null);
  }

  function handleOpenDeleteDialog(project: WorkshopProject) {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  }

  function handleDeleteProject() {
    if (!selectedProject) return;
    deleteProject.mutate(selectedProject.path, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedProject(null);
      },
      onError: (err) => console.error("Failed to delete project:", err.message),
    });
  }

  function handleCloseDeleteDialog() {
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  }

  async function handleImportModpkg() {
    const file = await open({
      multiple: false,
      filters: [{ name: "Mod Package", extensions: ["modpkg"] }],
    });
    if (file) {
      importFromModpkg.mutate(file, {
        onError: (err) => console.error("Failed to import modpkg:", err.message),
      });
    }
  }

  async function handleImportFantome() {
    const file = await open({
      multiple: false,
      filters: [{ name: "Fantome Archive", extensions: ["fantome", "zip"] }],
    });
    if (!file) return;

    peekFantome.mutate(file, {
      onSuccess: (result) => {
        setFantomePeek(result);
        setFantomeFilePath(file);
        setFantomeDialogOpen(true);
      },
      onError: (err) => console.error("Failed to peek fantome:", err.message),
    });
  }

  function handleImportFantomeSubmit(args: ImportFantomeArgs) {
    importFromFantome.mutate(args, {
      onSuccess: () => {
        setFantomeDialogOpen(false);
        setFantomePeek(null);
        setFantomeFilePath(null);
      },
      onError: (err) => console.error("Failed to import fantome:", err.message),
    });
  }

  function handleCloseFantomeDialog() {
    setFantomeDialogOpen(false);
    setFantomePeek(null);
    setFantomeFilePath(null);
  }

  function handleImportGitRepoSubmit(args: ImportGitRepoArgs) {
    importFromGitRepo.mutate(args, {
      onSuccess: () => setGitRepoDialogOpen(false),
      onError: (err) => console.error("Failed to import from git repo:", err.message),
    });
  }

  function renderContent() {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    if (filteredProjects.length === 0) {
      if (searchQuery) return <NoSearchResultsState />;
      return (
        <NoProjectsState onCreate={() => setNewProjectOpen(true)} onImport={handleImportFantome} />
      );
    }
    return (
      <ProjectGrid
        projects={filteredProjects}
        viewMode={viewMode}
        onEdit={handleEditProject}
        onPack={handleOpenPackDialog}
        onDelete={handleOpenDeleteDialog}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <WorkshopToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onImportModpkg={handleImportModpkg}
        onImportFantome={handleImportFantome}
        onImportGitRepo={() => setGitRepoDialogOpen(true)}
        onNewProject={() => setNewProjectOpen(true)}
        isImporting={importFromModpkg.isPending || peekFantome.isPending}
      />

      <div className="flex-1 overflow-auto p-6">{renderContent()}</div>

      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSubmit={handleCreateProject}
        isPending={createProject.isPending}
      />

      <PackDialog
        open={packDialogOpen}
        project={selectedProject}
        validation={validation ?? null}
        validationLoading={validationLoading}
        onClose={handleClosePackDialog}
        onPack={handlePack}
        isPacking={packProject.isPending}
        packResult={packResult}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        project={selectedProject}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteProject}
        isPending={deleteProject.isPending}
      />

      <ImportFantomeDialog
        open={fantomeDialogOpen}
        filePath={fantomeFilePath}
        peekResult={fantomePeek}
        progress={fantomeProgress}
        onClose={handleCloseFantomeDialog}
        onSubmit={handleImportFantomeSubmit}
        isPending={importFromFantome.isPending}
      />

      <ImportGitRepoDialog
        open={gitRepoDialogOpen}
        progress={gitImportProgress}
        onClose={() => setGitRepoDialogOpen(false)}
        onSubmit={handleImportGitRepoSubmit}
        isPending={importFromGitRepo.isPending}
      />
    </div>
  );
}
