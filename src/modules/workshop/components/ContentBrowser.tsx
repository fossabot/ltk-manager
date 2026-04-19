import { useEffect, useMemo, useState } from "react";

import { Spinner } from "@/components";
import type { LayerContent, WorkshopProject } from "@/lib/tauri";

import { useProjectContentTree } from "../api";
import { ContentBrowserLayerRail } from "./ContentBrowserLayerRail";
import { ContentBrowserLayerSection } from "./ContentBrowserLayerSection";

interface ContentBrowserProps {
  project: WorkshopProject;
}

export function ContentBrowser({ project }: ContentBrowserProps) {
  const projectPath = project.path;
  const { data, error, isLoading, isFetching, refetch } = useProjectContentTree(projectPath);

  const [selectedLayerName, setSelectedLayerName] = useState<string>(
    () => project.layers[0]?.name ?? "base",
  );

  const contentLayers = useMemo<readonly LayerContent[]>(() => data?.layers ?? [], [data]);

  const selectedLayer = useMemo<LayerContent | null>(() => {
    const match = contentLayers.find((l) => l.name === selectedLayerName);
    if (match) return match;
    return contentLayers[0] ?? null;
  }, [contentLayers, selectedLayerName]);

  useEffect(() => {
    // Keep selection in sync with what the content scan actually returned,
    // so renames/deletes elsewhere don't leave a dangling highlight.
    if (selectedLayer && selectedLayer.name !== selectedLayerName) {
      setSelectedLayerName(selectedLayer.name);
    }
  }, [selectedLayer, selectedLayerName]);

  return (
    <div className="flex h-full min-h-0">
      <ContentBrowserLayerRail
        project={project}
        contentLayers={contentLayers}
        selectedLayerName={selectedLayerName}
        onSelect={setSelectedLayerName}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-900/95">
        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-surface-400">
            <Spinner size="sm" />
            Scanning project…
          </div>
        )}

        {error && (
          <div className="m-3 rounded-md border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            Couldn&rsquo;t read the content directory: {error.message}
          </div>
        )}

        {selectedLayer && (
          <ContentBrowserLayerSection
            key={selectedLayer.name}
            projectPath={projectPath}
            layer={selectedLayer}
            isRefreshing={isFetching}
            onRefresh={() => refetch()}
          />
        )}

        {data && contentLayers.length === 0 && (
          <div className="m-3 rounded-md border border-dashed border-surface-700 px-4 py-6 text-center text-sm text-surface-400">
            No layer folders found on disk. Add a layer from the list on the left.
          </div>
        )}
      </div>
    </div>
  );
}
