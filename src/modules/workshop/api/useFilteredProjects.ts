import { useMemo } from "react";

import { useWorkshopViewStore } from "@/stores";

import { useWorkshopProjects } from "./useWorkshopProjects";

export function useFilteredProjects() {
  const { data: projects = [] } = useWorkshopProjects();
  const searchQuery = useWorkshopViewStore((s) => s.searchQuery);

  return useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.displayName.toLowerCase().includes(query) ||
        project.name.toLowerCase().includes(query),
    );
  }, [projects, searchQuery]);
}
