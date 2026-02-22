import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LuArrowLeft } from "react-icons/lu";

import { Button, NavTabs } from "@/components";
import {
  DeleteConfirmDialog,
  LoadingState,
  PackDialog,
  ProjectHeader,
  ProjectProvider,
  useProjectActions,
  useWorkshopProjects,
} from "@/modules/workshop";

export const Route = createFileRoute("/workshop/$projectName")({
  component: ProjectDetailLayout,
});

function ProjectDetailLayout() {
  const { projectName } = Route.useParams();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useWorkshopProjects();
  const project = projects?.find((p) => p.name === projectName);

  const actions = useProjectActions(project, navigate);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-surface-400">Project not found: {projectName}</p>
        <Link to="/workshop">
          <Button variant="outline" left={<LuArrowLeft className="h-4 w-4" />}>
            Back to Workshop
          </Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { to: "/workshop/$projectName", params: { projectName }, label: "Overview", exact: true },
    { to: "/workshop/$projectName/strings", params: { projectName }, label: "Strings" },
    { to: "/workshop/$projectName/layers", params: { projectName }, label: "Layers" },
  ];

  return (
    <ProjectProvider project={project}>
      <div className="flex h-full flex-col">
        <ProjectHeader
          project={project}
          onPack={actions.handleOpenPackDialog}
          onDelete={actions.openDeleteDialog}
          onOpenLocation={actions.handleOpenLocation}
        />

        <NavTabs tabs={tabs} />

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </div>

      <PackDialog
        open={actions.packDialogOpen}
        project={project}
        validation={actions.validation}
        validationLoading={actions.validationLoading}
        onClose={actions.handleClosePackDialog}
        onPack={actions.handlePack}
        isPacking={actions.isPacking}
        packResult={actions.packResult}
      />

      <DeleteConfirmDialog
        open={actions.deleteDialogOpen}
        project={project}
        onClose={actions.closeDeleteDialog}
        onConfirm={actions.handleDeleteProject}
        isPending={actions.isDeleting}
      />
    </ProjectProvider>
  );
}
