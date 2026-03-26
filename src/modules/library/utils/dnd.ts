const FOLDER_DROP_PREFIX = "folder:";

export function parseFolderDropId(id: string): string | null {
  if (id.startsWith(FOLDER_DROP_PREFIX)) return id.slice(FOLDER_DROP_PREFIX.length);
  return null;
}

export type DropTarget = { type: "folder"; folderId: string } | { type: "reorder" };

export function resolveDropTarget(overId: string): DropTarget {
  const folderId = parseFolderDropId(overId);
  if (folderId) return { type: "folder", folderId };
  return { type: "reorder" };
}

export function hasOrderChanged(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}
