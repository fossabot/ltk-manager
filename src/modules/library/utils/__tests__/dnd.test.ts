import { describe, expect, it } from "vitest";

import { hasOrderChanged, parseFolderDropId, resolveDropTarget } from "../dnd";

describe("parseFolderDropId", () => {
  it("extracts folder ID from prefixed string", () => {
    expect(parseFolderDropId("folder:abc-123")).toBe("abc-123");
  });

  it("returns null for non-folder IDs", () => {
    expect(parseFolderDropId("mod-123")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseFolderDropId("")).toBeNull();
  });

  it("handles folder prefix with empty ID", () => {
    expect(parseFolderDropId("folder:")).toBe("");
  });

  it("handles IDs containing 'folder' but without prefix", () => {
    expect(parseFolderDropId("my-folder-item")).toBeNull();
  });
});

describe("resolveDropTarget", () => {
  it("returns folder target for folder-prefixed ID", () => {
    expect(resolveDropTarget("folder:abc")).toEqual({ type: "folder", folderId: "abc" });
  });

  it("returns reorder target for non-folder ID", () => {
    expect(resolveDropTarget("mod-123")).toEqual({ type: "reorder" });
  });
});

describe("hasOrderChanged", () => {
  it("returns false for identical arrays", () => {
    expect(hasOrderChanged(["a", "b", "c"], ["a", "b", "c"])).toBe(false);
  });

  it("returns true for different order", () => {
    expect(hasOrderChanged(["a", "b", "c"], ["c", "b", "a"])).toBe(true);
  });

  it("returns true for different lengths", () => {
    expect(hasOrderChanged(["a", "b"], ["a", "b", "c"])).toBe(true);
  });

  it("returns false for empty arrays", () => {
    expect(hasOrderChanged([], [])).toBe(false);
  });

  it("returns true when one is empty", () => {
    expect(hasOrderChanged(["a"], [])).toBe(true);
  });
});
