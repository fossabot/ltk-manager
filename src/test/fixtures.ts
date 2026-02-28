import type { InstalledMod, Profile, Settings } from "@/lib/bindings";

export function createMockSettings(overrides?: Partial<Settings>): Settings {
  return {
    leaguePath: null,
    modStoragePath: null,
    workshopPath: null,
    firstRunComplete: false,
    theme: "system",
    accentColor: { preset: "blue", customHue: null },
    backdropImage: null,
    backdropBlur: null,
    libraryViewMode: "grid",
    patchTft: false,
    migrationDismissed: false,
    ...overrides,
  };
}

export function createMockInstalledMod(overrides?: Partial<InstalledMod>): InstalledMod {
  return {
    id: "test-mod-id",
    name: "test-mod",
    displayName: "Test Mod",
    version: "1.0.0",
    description: "A test mod",
    authors: ["Test Author"],
    enabled: true,
    installedAt: new Date().toISOString(),
    layers: [{ name: "base", priority: 0, enabled: true }],
    tags: [],
    champions: [],
    maps: [],
    modDir: "/path/to/mod",
    ...overrides,
  };
}

export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: "test-profile-id",
    name: "Test Profile",
    slug: "test-profile",
    enabledMods: [],
    modOrder: [],
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    ...overrides,
  };
}
