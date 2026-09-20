// Ref: ARCHITECTURE.md §10.2 (Undo/Redo).
// History snapshot helpers: pure, no React/DOM.
// Snapshot = { nodes, rootId } via structuredClone, capped at MAX_HISTORY.

import { current, isDraft } from 'immer';
import type { BuilderNode, NodeId } from '../serializer/types';

/** Maximum undo snapshot count (ARCHITECTURE.md §10.2). */
export const MAX_HISTORY = 20;

/** Text-edit debounce gap before a new snapshot is taken (ms). */
export const TEXT_EDIT_DEBOUNCE_MS = 300;

export interface DocSnapshot {
  nodes: Record<NodeId, BuilderNode>;
  rootId: NodeId | null;
}

function deepClone<T>(value: T): T {
  // Immer drafts are Proxies, so structuredClone throws DataCloneError.
  // current() returns a safe plain deep copy for cloning.
  const base: T = isDraft(value) ? current(value) : value;
  if (typeof structuredClone === 'function') return structuredClone(base);
  // Legacy env fallback: narrow the JSON.parse result (the AGENTS.md §2 `as` exception).
  return JSON.parse(JSON.stringify(base)) as T;
}

/** Take a deep-cloned snapshot of the current document state. */
export function takeSnapshot(
  nodes: Record<NodeId, BuilderNode>,
  rootId: NodeId | null,
): DocSnapshot {
  return { nodes: deepClone(nodes), rootId };
}

/**
 * Push a snapshot onto `past` (runs inside an immer producer, so draft mutation is fine).
 * Overflow is dropped from the oldest end. The caller clears `future`.
 */
export function pushHistory(past: DocSnapshot[], snap: DocSnapshot): void {
  past.push(snap);
  while (past.length > MAX_HISTORY) past.shift();
}

/**
 * True when a text edit may take a new snapshot: always on the first edit
 * after a structural action (`lastPushAt === null`), or when the gap reaches windowMs.
 */
export function shouldPushTextEdit(
  lastPushAt: number | null,
  now: number,
  windowMs: number = TEXT_EDIT_DEBOUNCE_MS,
): boolean {
  if (lastPushAt === null) return true;
  return now - lastPushAt >= windowMs;
}
