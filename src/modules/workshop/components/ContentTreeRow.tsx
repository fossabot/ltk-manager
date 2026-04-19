import { ChevronRight, Folder as FolderIconDefault, FolderOpen } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Tooltip } from "@/components";
import { formatBytes } from "@/utils";

import type { ContentTreeNode, DirNode, FileNode } from "../utils/contentTree";
import { describeFileKind } from "../utils/fileKindIcon";

/** Shared row styling. Kept as string constants so the hover/selected variants
 * cascade cleanly in Tailwind 4 — selected-hover has to beat plain hover, so
 * it appears later in the class string. */
const ROW_BASE_CLASSES =
  "flex items-center gap-1.5 pr-3 select-none text-surface-200 outline-none transition-colors duration-100";
const ROW_STATE_CLASSES =
  "hover:bg-surface-700/70 hover:text-surface-100 " +
  "aria-selected:bg-accent-500/15 aria-selected:text-accent-100 " +
  "aria-selected:hover:bg-accent-500/25 " +
  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500/70";

interface TreeRowProps {
  node: ContentTreeNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  dirFileCount: number;
  onToggle: (path: string) => void;
  onSelect: () => void;
  height: number;
  rowIndex: number;
  tabIndex: number;
}

export function TreeRow({
  node,
  depth,
  isExpanded,
  isSelected,
  dirFileCount,
  onToggle,
  onSelect,
  height,
  rowIndex,
  tabIndex,
}: TreeRowProps) {
  if (node.type === "dir") {
    return (
      <DirRow
        node={node}
        depth={depth}
        isExpanded={isExpanded}
        isSelected={isSelected}
        fileCount={dirFileCount}
        onToggle={onToggle}
        onSelect={onSelect}
        height={height}
        rowIndex={rowIndex}
        tabIndex={tabIndex}
      />
    );
  }
  return (
    <FileRow
      node={node}
      depth={depth}
      isSelected={isSelected}
      onSelect={onSelect}
      height={height}
      rowIndex={rowIndex}
      tabIndex={tabIndex}
    />
  );
}

/** One 14px-wide column per ancestor level, each drawing a 1px vertical guide
 * on its left edge. Since every row in the virtual window draws its own rails
 * at the same left offsets, the lines appear continuous. */
function IndentRails({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="w-[14px] shrink-0 self-stretch border-l border-surface-700"
        />
      ))}
    </>
  );
}

interface DirRowProps {
  node: DirNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  fileCount: number;
  onToggle: (path: string) => void;
  onSelect: () => void;
  height: number;
  rowIndex: number;
  tabIndex: number;
}

function DirRow({
  node,
  depth,
  isExpanded,
  isSelected,
  fileCount,
  onToggle,
  onSelect,
  height,
  rowIndex,
  tabIndex,
}: DirRowProps) {
  const FolderIcon = isExpanded ? FolderOpen : FolderIconDefault;

  return (
    <button
      type="button"
      role="treeitem"
      aria-expanded={isExpanded}
      aria-level={depth + 1}
      aria-selected={isSelected}
      data-treeitem-index={rowIndex}
      tabIndex={tabIndex}
      onClick={() => {
        onSelect();
        onToggle(node.path);
      }}
      onContextMenu={onSelect}
      onFocus={onSelect}
      style={{ height: `${height}px` }}
      className={twMerge("w-full cursor-pointer text-left", ROW_BASE_CLASSES, ROW_STATE_CLASSES)}
    >
      <IndentRails depth={depth} />
      <ChevronRight
        className={twMerge(
          "h-3 w-3 shrink-0 text-surface-400 transition-transform",
          isExpanded && "rotate-90",
        )}
      />
      <FolderIcon
        className={twMerge(
          "h-3.5 w-3.5 shrink-0",
          isExpanded ? "text-accent-400" : "text-surface-400",
        )}
        strokeWidth={1.75}
      />
      <span className="truncate">{node.name}</span>
      <span className="ml-auto shrink-0 text-[11px] text-surface-500 tabular-nums">
        {fileCount}
      </span>
    </button>
  );
}

interface FileRowProps {
  node: FileNode;
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
  height: number;
  rowIndex: number;
  tabIndex: number;
}

function FileRow({ node, depth, isSelected, onSelect, height, rowIndex, tabIndex }: FileRowProps) {
  const descriptor = describeFileKind(node.entry.kind);
  const Icon = descriptor.icon;

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={isSelected}
      data-treeitem-index={rowIndex}
      tabIndex={tabIndex}
      onClick={onSelect}
      onContextMenu={onSelect}
      onFocus={onSelect}
      style={{ height: `${height}px` }}
      className={twMerge("cursor-default", ROW_BASE_CLASSES, ROW_STATE_CLASSES)}
    >
      <IndentRails depth={depth} />
      {/* Reserve chevron slot on files so file and dir names stay column-aligned. */}
      <span aria-hidden="true" className="h-3 w-3 shrink-0" />
      <Tooltip content={descriptor.label}>
        <span
          className="shrink-0"
          style={{ color: `var(${descriptor.tintToken})` }}
          aria-label={descriptor.label}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      </Tooltip>
      <span className="truncate">{node.name}</span>
      <span className="ml-auto shrink-0 font-mono text-[11px] text-surface-400 tabular-nums">
        {formatBytes(Number(node.entry.sizeBytes))}
      </span>
    </div>
  );
}
