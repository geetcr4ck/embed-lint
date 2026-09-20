// Ref: ARCHITECTURE.md §5.1 (Document Tree), §10 (State Management), §12 (Persistence).
// Document Zustand store plus undo/redo history. Pure logic plus Zustand/immer; no React/DOM.
//
// Canonical builder types from lib/serializer/types.ts (single source, not local duplicates).

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ALLOWED_TYPES, type ComponentType } from '../schema/constants';
import type {
  ActionRowNode,
  BuilderNode,
  ButtonEmoji,
  ButtonNode,
  ContainerNode,
  MediaGalleryItem,
  MediaGalleryNode,
  NodeId,
  SectionNode,
  SeparatorNode,
  TextDisplayNode,
  ThumbnailNode,
} from '../serializer/types';
// Re-export for compatibility: existing consumers (hooks/tests) may import types from here.
export type {
  ActionRowNode,
  BuilderNode,
  ButtonEmoji,
  ButtonNode,
  ContainerNode,
  MediaGalleryItem,
  MediaGalleryNode,
  NodeId,
  SectionNode,
  SeparatorNode,
  TextDisplayNode,
  ThumbnailNode,
} from '../serializer/types';
import { createId } from '../utils/id';
import {
  MAX_HISTORY,
  pushHistory,
  shouldPushTextEdit,
  takeSnapshot,
  type DocSnapshot,
} from './history';

export interface DocumentMeta {
  version: 1;
}

export interface DocumentState {
  nodes: Record<NodeId, BuilderNode>;
  rootId: NodeId | null;
  selectedId: NodeId | null;
  past: DocSnapshot[];
  future: DocSnapshot[];
  meta: DocumentMeta;
}

/**
 * Partial patch per node type. Structural keys (id/type/parentId/children/accessoryId)
 * are ignored at runtime - structure only changes via add/move/removeNode.
 */
export type NodePatch =
  | Partial<ContainerNode>
  | Partial<SectionNode>
  | Partial<TextDisplayNode>
  | Partial<ButtonNode>
  | Partial<ThumbnailNode>
  | Partial<MediaGalleryNode>
  | Partial<SeparatorNode>
  | Partial<ActionRowNode>;

export interface DocumentStore {
  doc: DocumentState;
  /** Timestamp of the last text snapshot; null means no active debounce window. */
  lastTextPushAt: number | null;
  addNode: (parentId: NodeId | null, type: ComponentType, index?: number) => NodeId;
  updateNode: (id: NodeId, patch: NodePatch, now?: number) => void;
  moveNode: (id: NodeId, newParentId: NodeId, index?: number) => void;
  removeNode: (id: NodeId) => void;
  select: (id: NodeId | null) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  exportSnapshot: () => string;
  importSnapshot: (json: string) => void;
}

// ---------------------------------------------------------------------------
// Minimal allowedParents/allowedChildren rules.
// Ref: ARCHITECTURE.md §17 + LINK PREVIEW §17 (SECTION_SHAPE, Action Row, single root).
// ---------------------------------------------------------------------------

/** Section: at most 1-3 Text Displays plus 1 accessory (Thumbnail/Button). */
export const SECTION_MAX_TEXT = 3;
/** Action Row: Buttons only, at most 5. */
export const ACTION_ROW_MAX_BUTTONS = 5;

const ID_PREFIX: Record<ComponentType, string> = {
  1: 'actionrow',
  2: 'button',
  9: 'section',
  10: 'text',
  11: 'thumb',
  12: 'gallery',
  14: 'sep',
  17: 'container',
};

interface AttachCheck {
  /** Id of the node being moved - excluded from capacity counts. */
  ignoreId?: NodeId;
}

function assertCanAttach(
  nodes: Record<NodeId, BuilderNode>,
  rootId: NodeId | null,
  parentId: NodeId | null,
  type: ComponentType,
  check?: AttachCheck,
): void {
  // Container: single root, never nested.
  if (type === 17) {
    if (parentId !== null) {
      throw new Error('CONTAINER_ROOT_ONLY: Container (17) must be the root.');
    }
    if (rootId !== null) {
      throw new Error('ROOT_SINGLETON: only one root Container is allowed.');
    }
    return;
  }
  if (parentId === null) {
    throw new Error(`NEEDS_PARENT: type ${type} requires a parent.`);
  }
  const parent = nodes[parentId];
  if (!parent) throw new Error(`PARENT_NOT_FOUND: parent "${parentId}" does not exist.`);
  switch (parent.type) {
    case 17:
      // Every non-container type may sit directly under a Container.
      return;
    case 9: {
      if (type === 10) {
        const texts = parent.children.filter(
          (cid) => cid !== check?.ignoreId && nodes[cid]?.type === 10,
        ).length;
        if (texts >= SECTION_MAX_TEXT) {
          throw new Error('SECTION_SHAPE: Section holds at most 3 Text Displays.');
        }
        return;
      }
      if (type === 2 || type === 11) {
        if (parent.accessoryId !== undefined && parent.accessoryId !== check?.ignoreId) {
          throw new Error('SECTION_ACCESSORY_SINGLE: Section allows only 1 accessory.');
        }
        return;
      }
      throw new Error('SECTION_SHAPE: Section holds 1-3 Text Displays plus 1 accessory.');
    }
    case 1: {
      if (type !== 2) throw new Error('ACTION_ROW_CHILD: Action Rows hold only Buttons.');
      const buttons = parent.children.filter((cid) => cid !== check?.ignoreId).length;
      if (buttons >= ACTION_ROW_MAX_BUTTONS) {
        throw new Error('ACTION_ROW_FULL: Action Row holds at most 5 Buttons.');
      }
      return;
    }
    default:
      throw new Error(`LEAF_NO_CHILDREN: type ${parent.type} cannot have children.`);
  }
}

function createNode(type: ComponentType, id: NodeId): BuilderNode {
  switch (type) {
    case 17:
      return { id, type, children: [] };
    case 9:
      return { id, type, children: [] };
    case 1:
      return { id, type, children: [] };
    case 10:
      return { id, type, content: '' };
    case 2:
      return { id, type, style: 5, url: '', label: 'Button' };
    case 11:
      return { id, type, url: '' };
    case 12:
      return { id, type, items: [] };
    case 14:
      return { id, type, divider: true, spacing: 1 };
  }
}

/** Attach a node to its parent (called after assertCanAttach passes). */
function attach(
  nodes: Record<NodeId, BuilderNode>,
  parentId: NodeId,
  node: BuilderNode,
  index?: number,
): void {
  const parent = nodes[parentId];
  if (!parent) throw new Error(`PARENT_NOT_FOUND: parent "${parentId}" does not exist.`);
  node.parentId = parentId;
  // Section accessories (Thumbnail/Button) live in accessoryId, not children.
  if (parent.type === 9 && (node.type === 2 || node.type === 11)) {
    parent.accessoryId = node.id;
    return;
  }
  // assertCanAttach guarantees a Container/Section/ActionRow parent (children required).
  if (parent.type === 17 || parent.type === 9 || parent.type === 1) {
    const list = parent.children;
    const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length));
    list.splice(at, 0, node.id);
    return;
  }
  throw new Error(`LEAF_NO_CHILDREN: type ${parent.type} cannot have children.`);
}

/** Detach a node from its parent (children or accessoryId). */
function detach(nodes: Record<NodeId, BuilderNode>, node: BuilderNode): void {
  const parentId = node.parentId;
  if (parentId === undefined) return;
  const parent = nodes[parentId];
  if (parent && parent.type === 9 && parent.accessoryId === node.id) {
    delete parent.accessoryId;
  } else if (
    parent &&
    (parent.type === 17 || parent.type === 9 || parent.type === 1)
  ) {
    const idx = parent.children.indexOf(node.id);
    if (idx >= 0) parent.children.splice(idx, 1);
  }
  delete node.parentId;
}

/** Collect a node id plus its whole subtree (children + accessory). */
function collectSubtree(nodes: Record<NodeId, BuilderNode>, root: NodeId): NodeId[] {
  const out: NodeId[] = [];
  const stack: NodeId[] = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || out.includes(current)) continue;
    out.push(current);
    const node = nodes[current];
    if (!node) continue;
    if (node.type === 17 || node.type === 9 || node.type === 1) {
      stack.push(...node.children);
    }
    if (node.type === 9 && node.accessoryId !== undefined) stack.push(node.accessoryId);
  }
  return out;
}

/**
 * Apply a scalar patch to a draft node. Returns true when something changed.
 * Structural keys are never read here, so they are ignored automatically.
 */
function applyPatch(node: BuilderNode, patch: NodePatch): boolean {
  let changed = false;
  switch (node.type) {
    case 17: {
      if ('accentColor' in patch && patch.accentColor !== undefined && node.accentColor !== patch.accentColor) {
        node.accentColor = patch.accentColor;
        changed = true;
      }
      if ('spoiler' in patch && patch.spoiler !== undefined && node.spoiler !== patch.spoiler) {
        node.spoiler = patch.spoiler;
        changed = true;
      }
      return changed;
    }
    case 10: {
      if ('content' in patch && patch.content !== undefined && node.content !== patch.content) {
        node.content = patch.content;
        changed = true;
      }
      return changed;
    }
    case 2: {
      if ('url' in patch && patch.url !== undefined && node.url !== patch.url) {
        node.url = patch.url;
        changed = true;
      }
      if ('label' in patch && patch.label !== undefined && node.label !== patch.label) {
        node.label = patch.label;
        changed = true;
      }
      if ('disabled' in patch && patch.disabled !== undefined && node.disabled !== patch.disabled) {
        node.disabled = patch.disabled;
        changed = true;
      }
      if ('emoji' in patch && patch.emoji !== undefined) {
        const next = patch.emoji;
        const cur = node.emoji;
        if (cur?.name !== next.name || cur?.id !== next.id || cur?.animated !== next.animated) {
          const emoji: ButtonEmoji = { name: next.name };
          if (next.id !== undefined) emoji.id = next.id;
          if (next.animated !== undefined) emoji.animated = next.animated;
          node.emoji = emoji;
          changed = true;
        }
      }
      return changed;
    }
    case 11: {
      // Canonical: Thumbnails hold ONLY a url (payload §18 = { media: { url } }).
      // description/spoiler are REJECTED so no data silently disappears on export.
      if ('url' in patch && patch.url !== undefined && node.url !== patch.url) {
        node.url = patch.url;
        changed = true;
      }
      return changed;
    }
    case 12: {
      if ('items' in patch && patch.items !== undefined) {
        const next = patch.items.map((it) => {
          const item: MediaGalleryItem = { url: it.url };
          if (it.description !== undefined) item.description = it.description;
          if (it.spoiler !== undefined) item.spoiler = it.spoiler;
          return item;
        });
        if (JSON.stringify(node.items) !== JSON.stringify(next)) {
          node.items = next;
          changed = true;
        }
      }
      return changed;
    }
    case 14: {
      if ('divider' in patch && patch.divider !== undefined && node.divider !== patch.divider) {
        node.divider = patch.divider;
        changed = true;
      }
      if ('spacing' in patch && patch.spacing !== undefined && node.spacing !== patch.spacing) {
        node.spacing = patch.spacing;
        changed = true;
      }
      return changed;
    }
    case 9:
    case 1:
    default:
      // Sections and Action Rows have no scalar fields (structure via add/move/remove).
      return false;
  }
}

// ---------------------------------------------------------------------------
// Snapshot import (localStorage / file). Manual shape validation; no `as`
// except JSON.parse boundary narrowing (AGENTS.md §2).
// ---------------------------------------------------------------------------

const SNAPSHOT_VERSION = 1;

function isComponentType(value: number): value is ComponentType {
  return (ALLOWED_TYPES as readonly number[]).includes(value);
}

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function optNum(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function optBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function optIdList(v: unknown): NodeId[] | undefined {
  if (!Array.isArray(v)) return undefined;
  if (!v.every((e: unknown): e is string => typeof e === 'string')) return undefined;
  return [...v];
}

function parseNode(key: string, value: unknown): BuilderNode {
  const invalid = `SNAPSHOT_INVALID: node "${key}" has an invalid shape.`;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(invalid);
  const rec: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) rec[k] = v;
  const { id, type } = rec;
  if (typeof id !== 'string' || typeof type !== 'number' || !isComponentType(type)) {
    throw new Error(invalid);
  }
  const parentId = optStr(rec.parentId);
  const children = optIdList(rec.children) ?? [];
  switch (type) {
    case 17: {
      const node: ContainerNode = { id, type, children };
      if (parentId !== undefined) node.parentId = parentId;
      const accent = optNum(rec.accentColor);
      if (accent !== undefined) node.accentColor = accent;
      const spoiler = optBool(rec.spoiler);
      if (spoiler !== undefined) node.spoiler = spoiler;
      return node;
    }
    case 9: {
      const node: SectionNode = { id, type, children };
      if (parentId !== undefined) node.parentId = parentId;
      const accessoryId = optStr(rec.accessoryId);
      if (accessoryId !== undefined) node.accessoryId = accessoryId;
      return node;
    }
    case 1: {
      const node: ActionRowNode = { id, type, children };
      if (parentId !== undefined) node.parentId = parentId;
      return node;
    }
    case 10: {
      const content = optStr(rec.content);
      if (content === undefined) throw new Error(invalid);
      const node: TextDisplayNode = { id, type, content };
      if (parentId !== undefined) node.parentId = parentId;
      return node;
    }
    case 2: {
      const url = optStr(rec.url);
      if (url === undefined) throw new Error(invalid);
      const node: ButtonNode = { id, type, style: 5, url };
      if (parentId !== undefined) node.parentId = parentId;
      const label = optStr(rec.label);
      if (label !== undefined) node.label = label;
      const disabled = optBool(rec.disabled);
      if (disabled !== undefined) node.disabled = disabled;
      const rawEmoji = rec.emoji;
      if (typeof rawEmoji === 'object' && rawEmoji !== null && !Array.isArray(rawEmoji)) {
        const emojiRec: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rawEmoji)) emojiRec[k] = v;
        const name = optStr(emojiRec.name);
        if (name !== undefined) {
          const emoji: ButtonEmoji = { name };
          const emojiId = optStr(emojiRec.id);
          if (emojiId !== undefined) emoji.id = emojiId;
          const animated = optBool(emojiRec.animated);
          if (animated !== undefined) emoji.animated = animated;
          node.emoji = emoji;
        }
      }
      return node;
    }
    case 11: {
      const url = optStr(rec.url);
      if (url === undefined) throw new Error(invalid);
      const node: ThumbnailNode = { id, type, url };
      if (parentId !== undefined) node.parentId = parentId;
      // description/spoiler are REJECTED (see applyPatch): dropped when present in a snapshot.
      return node;
    }
    case 12: {
      const node: MediaGalleryNode = { id, type, items: [] };
      if (parentId !== undefined) node.parentId = parentId;
      const rawItems = rec.items;
      if (Array.isArray(rawItems)) {
        for (const raw of rawItems) {
          if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue;
          const itemRec: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(raw)) itemRec[k] = v;
          const url = optStr(itemRec.url);
          if (url === undefined) continue;
          const item: MediaGalleryItem = { url };
          const description = optStr(itemRec.description);
          if (description !== undefined) item.description = description;
          const spoiler = optBool(itemRec.spoiler);
          if (spoiler !== undefined) item.spoiler = spoiler;
          node.items.push(item);
        }
      }
      return node;
    }
    case 14: {
      const node: SeparatorNode = { id, type };
      if (parentId !== undefined) node.parentId = parentId;
      const divider = optBool(rec.divider);
      if (divider !== undefined) node.divider = divider;
      const spacing = rec.spacing;
      if (spacing === 1 || spacing === 2) node.spacing = spacing;
      return node;
    }
  }
}

function parseSnapshot(json: string): { nodes: Record<NodeId, BuilderNode>; rootId: NodeId | null } {
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    throw new Error('SNAPSHOT_INVALID: JSON could not be parsed.');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('SNAPSHOT_INVALID: snapshot root must be an object.');
  }
  if (!('nodes' in raw) || !('rootId' in raw)) {
    throw new Error('SNAPSHOT_INVALID: nodes/rootId keys are required.');
  }
  const { nodes: nodesRaw, rootId: rootRaw } = raw;
  const version: unknown = 'version' in raw ? raw.version : undefined;
  if (version !== undefined && version !== SNAPSHOT_VERSION) {
    throw new Error('SNAPSHOT_INVALID: unsupported snapshot version.');
  }
  if (typeof nodesRaw !== 'object' || nodesRaw === null || Array.isArray(nodesRaw)) {
    throw new Error('SNAPSHOT_INVALID: nodes must be an object.');
  }
  const nodes: Record<NodeId, BuilderNode> = {};
  for (const [key, value] of Object.entries(nodesRaw)) {
    nodes[key] = parseNode(key, value);
  }
  let rootId: NodeId | null = null;
  if (rootRaw !== null) {
    if (typeof rootRaw !== 'string' || nodes[rootRaw]?.type !== 17) {
      throw new Error('SNAPSHOT_INVALID: rootId must point to a Container (17).');
    }
    rootId = rootRaw;
  }
  // Drop dangling references (a partially corrupt snapshot still opens).
  for (const node of Object.values(nodes)) {
    if (node.type === 17 || node.type === 9 || node.type === 1) {
      node.children = node.children.filter((cid) => nodes[cid] !== undefined);
    }
    if (node.type === 9 && node.accessoryId !== undefined && nodes[node.accessoryId] === undefined) {
      delete node.accessoryId;
    }
    if (node.parentId !== undefined && nodes[node.parentId] === undefined) {
      delete node.parentId;
    }
  }
  return { nodes, rootId };
}

function createInitialDoc(): DocumentState {
  return { nodes: {}, rootId: null, selectedId: null, past: [], future: [], meta: { version: 1 } };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDocumentStore = create<DocumentStore>()(
  immer((set, get) => ({
    doc: createInitialDoc(),
    lastTextPushAt: null,

    addNode: (parentId, type, index) => {
      let createdId = '';
      set((state) => {
        assertCanAttach(state.doc.nodes, state.doc.rootId, parentId, type);
        const id = createId(ID_PREFIX[type]);
        const node = createNode(type, id);
        pushHistory(state.doc.past, takeSnapshot(state.doc.nodes, state.doc.rootId));
        state.doc.nodes[id] = node;
        if (type === 17) {
          state.doc.rootId = id;
        } else if (parentId !== null) {
          attach(state.doc.nodes, parentId, node, index);
        }
        state.doc.future = [];
        state.lastTextPushAt = null;
        createdId = id;
      });
      return createdId;
    },

    updateNode: (id, patch, now) => {
      set((state) => {
        const node = state.doc.nodes[id];
        if (!node) throw new Error(`NODE_NOT_FOUND: node "${id}" does not exist.`);
        const at = now ?? Date.now();
        // Pre-mutation snapshot: taken BEFORE applyPatch so undo returns
        // to the old value (not the already-mutated state).
        const snap = takeSnapshot(state.doc.nodes, state.doc.rootId);
        const changed = applyPatch(node, patch);
        if (!changed) return;
        if (shouldPushTextEdit(state.lastTextPushAt, at)) {
          pushHistory(state.doc.past, snap);
          state.lastTextPushAt = at;
        }
        state.doc.future = [];
      });
    },

    moveNode: (id, newParentId, index) => {
      set((state) => {
        const node = state.doc.nodes[id];
        if (!node) throw new Error(`NODE_NOT_FOUND: node "${id}" does not exist.`);
        if (node.type === 17) {
          throw new Error('ROOT_IMMOVABLE: The root Container cannot be moved.');
        }
        if (!state.doc.nodes[newParentId]) {
          throw new Error(`PARENT_NOT_FOUND: parent "${newParentId}" does not exist.`);
        }
        assertCanAttach(state.doc.nodes, state.doc.rootId, newParentId, node.type, {
          ignoreId: id,
        });
        pushHistory(state.doc.past, takeSnapshot(state.doc.nodes, state.doc.rootId));
        detach(state.doc.nodes, node);
        attach(state.doc.nodes, newParentId, node, index);
        state.doc.future = [];
        state.lastTextPushAt = null;
      });
    },

    removeNode: (id) => {
      set((state) => {
        const node = state.doc.nodes[id];
        if (!node) return;
        pushHistory(state.doc.past, takeSnapshot(state.doc.nodes, state.doc.rootId));
        const ids = collectSubtree(state.doc.nodes, id);
        detach(state.doc.nodes, node);
        for (const nid of ids) delete state.doc.nodes[nid];
        if (state.doc.rootId === id) state.doc.rootId = null;
        if (state.doc.selectedId !== null && state.doc.nodes[state.doc.selectedId] === undefined) {
          state.doc.selectedId = null;
        }
        state.doc.future = [];
        state.lastTextPushAt = null;
      });
    },

    select: (id) => {
      set((state) => {
        state.doc.selectedId = id;
      });
    },

    undo: () => {
      set((state) => {
        const prev = state.doc.past.pop();
        if (!prev) return;
        state.doc.future.push(takeSnapshot(state.doc.nodes, state.doc.rootId));
        state.doc.nodes = prev.nodes;
        state.doc.rootId = prev.rootId;
        if (state.doc.selectedId !== null && state.doc.nodes[state.doc.selectedId] === undefined) {
          state.doc.selectedId = null;
        }
        state.lastTextPushAt = null;
      });
    },

    redo: () => {
      set((state) => {
        const next = state.doc.future.pop();
        if (!next) return;
        state.doc.past.push(takeSnapshot(state.doc.nodes, state.doc.rootId));
        while (state.doc.past.length > MAX_HISTORY) state.doc.past.shift();
        state.doc.nodes = next.nodes;
        state.doc.rootId = next.rootId;
        if (state.doc.selectedId !== null && state.doc.nodes[state.doc.selectedId] === undefined) {
          state.doc.selectedId = null;
        }
        state.lastTextPushAt = null;
      });
    },

    reset: () => {
      set((state) => {
        state.doc = createInitialDoc();
        state.lastTextPushAt = null;
      });
    },

    exportSnapshot: () => {
      const { nodes, rootId } = get().doc;
      return JSON.stringify({ version: SNAPSHOT_VERSION, nodes, rootId, savedAt: Date.now() });
    },

    importSnapshot: (json) => {
      const { nodes, rootId } = parseSnapshot(json);
      set((state) => {
        state.doc.nodes = nodes;
        state.doc.rootId = rootId;
        state.doc.selectedId = null;
        state.doc.past = [];
        state.doc.future = [];
        state.lastTextPushAt = null;
      });
    },
  })),
);
