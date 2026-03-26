import { createFileRoute } from "@tanstack/react-router";

import { Library } from "@/pages/Library";

export const Route = createFileRoute("/folder/$folderId")({
  component: FolderRoute,
});

function FolderRoute() {
  const { folderId } = Route.useParams();
  return <Library folderId={folderId} />;
}
