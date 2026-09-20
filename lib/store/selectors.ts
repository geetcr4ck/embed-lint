// Ref: ARCHITECTURE.md §10 (State Management), §15 (granular anti-rerender selectors).
// Pure selectors (state => ...) plus granular hooks. Never useStore(s => s).

import type { BuilderNode, NodeId } from '../serializer/types';
import { useDocumentStore } from './document';
import type { DocumentStore } from './document';

// ---------------------------------------------------------------------------
// Pure selectors
// ---------------------------------------------------------------------------

export function selectNodes(s: DocumentStore): Record<NodeId, BuilderNode> {
  return s.doc.nodes;
}

export function selectRootId(s: DocumentStore): NodeId | null {
  return s.doc.rootId;
}

export function selectSelectedId(s: DocumentStore): NodeId | null {
  return s.doc.selectedId;
}

export function selectNodeById(s: DocumentStore, id: NodeId): BuilderNode | undefined {
  return s.doc.nodes[id];
}

export function selectRootNode(s: DocumentStore): BuilderNode | undefined {
  const rootId = s.doc.rootId;
  if (rootId === null) return undefined;
  return s.doc.nodes[rootId];
}

export function selectSelectedNode(s: DocumentStore): BuilderNode | undefined {
  const selectedId = s.doc.selectedId;
  if (selectedId === null) return undefined;
  return s.doc.nodes[selectedId];
}

export function selectParentId(s: DocumentStore, id: NodeId): NodeId | undefined {
  return s.doc.nodes[id]?.parentId;
}

export function selectIsSelected(s: DocumentStore, id: NodeId): boolean {
  return s.doc.selectedId === id;
}

/**
 * Direct child ids of a node. For Sections, the accessoryId is appended last
 * (after the Text Display children).
 */
export function selectChildIds(s: DocumentStore, id: NodeId): NodeId[] {
  const node = s.doc.nodes[id];
  if (!node) return [];
  // children is required on Container/Section/ActionRow; absent on leaves.
  const ids: NodeId[] =
    node.type === 17 || node.type === 9 || node.type === 1 ? [...node.children] : [];
  if (node.type === 9 && node.accessoryId !== undefined) ids.push(node.accessoryId);
  return ids;
}

/** Direct child nodes (dangling references are skipped). */
export function selectChildren(s: DocumentStore, id: NodeId): BuilderNode[] {
  const out: BuilderNode[] = [];
  for (const cid of selectChildIds(s, id)) {
    const child = s.doc.nodes[cid];
    if (child) out.push(child);
  }
  return out;
}

/** Total components in the document (for MAX_COMPONENTS). */
export function selectComponentCount(s: DocumentStore): number {
  return Object.keys(s.doc.nodes).length;
}

export function selectCanUndo(s: DocumentStore): boolean {
  return s.doc.past.length > 0;
}

export function selectCanRedo(s: DocumentStore): boolean {
  return s.doc.future.length > 0;
}

// ---------------------------------------------------------------------------
// Granular hooks (one subscription per render need)
// ---------------------------------------------------------------------------

export function useRootNode(): BuilderNode | undefined {
  return useDocumentStore(selectRootNode);
}

export function useRootId(): NodeId | null {
  return useDocumentStore(selectRootId);
}

export function useSelectedId(): NodeId | null {
  return useDocumentStore(selectSelectedId);
}

export function useSelectedNode(): BuilderNode | undefined {
  return useDocumentStore(selectSelectedNode);
}

export function useNodeById(id: NodeId): BuilderNode | undefined {
  return useDocumentStore((s) => selectNodeById(s, id));
}

export function useChildIds(id: NodeId): NodeId[] {
  return useDocumentStore((s) => selectChildIds(s, id));
}

export function useComponentCount(): number {
  return useDocumentStore(selectComponentCount);
}

export function useCanUndo(): boolean {
  return useDocumentStore(selectCanUndo);
}

export function useCanRedo(): boolean {
  return useDocumentStore(selectCanRedo);
}
