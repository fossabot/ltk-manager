import type { InstalledMod } from "@/lib/tauri";

export interface ToggleMessage {
  title: string;
  description: string;
}

export function formatToggleMessage(
  enabled: boolean,
  count: number,
  folderName: string,
): ToggleMessage {
  const action = enabled ? "Enabled" : "Disabled";
  return {
    title: `${action} ${count} mod${count !== 1 ? "s" : ""}`,
    description: `All mods in "${folderName}" have been ${enabled ? "enabled" : "disabled"}`,
  };
}

export interface FolderEnabledState {
  enabledCount: number;
  checked: boolean;
  indeterminate: boolean;
}

export function getFolderEnabledState(mods: InstalledMod[]): FolderEnabledState {
  const enabledCount = mods.filter((m) => m.enabled).length;
  if (mods.length === 0) return { enabledCount: 0, checked: false, indeterminate: false };
  if (enabledCount === mods.length) return { enabledCount, checked: true, indeterminate: false };
  if (enabledCount > 0) return { enabledCount, checked: false, indeterminate: true };
  return { enabledCount: 0, checked: false, indeterminate: false };
}

export function getFolderSummary(mods: InstalledMod[]): string {
  const champs = new Set<string>();
  const tags = new Set<string>();
  for (const m of mods) {
    for (const c of m.champions) champs.add(c);
    for (const t of m.tags) tags.add(t);
  }
  const parts: string[] = [];
  if (champs.size > 0) parts.push(`${champs.size} champ${champs.size !== 1 ? "s" : ""}`);
  if (tags.size > 0) parts.push(`${tags.size} tag${tags.size !== 1 ? "s" : ""}`);
  return parts.join(" · ");
}
