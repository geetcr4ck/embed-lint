// Ref: ARCH §5.1 - Document Tree (internal state, not the Discord payload).
// The editor keeps rich tree nodes for the UI, then serializes to a payload.
// Discord payload types come ONLY from lib/schema/ (never redefine them here).
// Pure: no React/DOM, no `any`.
//
// This file is the SINGLE canonical source of builder types (used by both the
// serializer AND lib/store/document.ts). Unification decisions:
// - children: NodeId[] is REQUIRED on Container/Section/ActionRow; absent on leaves.
// - ThumbnailNode holds ONLY a url (payload §18 = { media: { url } }); description/spoiler
//   are REJECTED at builder level so no data silently disappears on export.

import type { ComponentType } from '../schema/constants';

export type NodeId = string;

interface BaseNode {
  id: NodeId;
  type: ComponentType;
  parentId?: NodeId;
}

/** §16 - root Container. accentColor is stored directly as an integer. */
export interface ContainerNode extends BaseNode {
  type: 17;
  children: NodeId[];
  accentColor?: number;
  spoiler?: boolean;
}

/** §17 - Section: children are 1-3 Text Displays, accessory is optional. */
export interface SectionNode extends BaseNode {
  type: 9;
  children: NodeId[];
  accessoryId?: NodeId;
}

export interface TextDisplayNode extends BaseNode {
  type: 10;
  content: string;
}

/** §17 - Button emoji { name, id?, animated? }; used by the store and serializer. */
export interface ButtonEmoji {
  name: string;
  id?: string;
  animated?: boolean;
}

/** §17 - Buttons are locked to style 5 (link). */
export interface ButtonNode extends BaseNode {
  type: 2;
  style: 5;
  url: string;
  label?: string;
  emoji?: ButtonEmoji;
  disabled?: boolean;
}

/** §18 - Thumbnail: url only (payload { media: { url } }). */
export interface ThumbnailNode extends BaseNode {
  type: 11;
  url: string;
}

export interface MediaGalleryItem {
  url: string;
  description?: string;
  spoiler?: boolean;
}

/** §18 - Gallery item: media plus optional description/spoiler. */
export interface MediaGalleryNode extends BaseNode {
  type: 12;
  items: MediaGalleryItem[];
}

export interface SeparatorNode extends BaseNode {
  type: 14;
  divider?: boolean;
  spacing?: 1 | 2;
}

/** Read-only subset: Action Rows hold only link Buttons. */
export interface ActionRowNode extends BaseNode {
  type: 1;
  children: NodeId[];
}

export type BuilderNode =
  | ContainerNode
  | SectionNode
  | TextDisplayNode
  | ButtonNode
  | ThumbnailNode
  | MediaGalleryNode
  | SeparatorNode
  | ActionRowNode;

/** Normalized tree: nodes dict plus rootId (see ARCH §5.1 DocumentState). */
export interface BuilderTree {
  nodes: Record<NodeId, BuilderNode>;
  rootId: NodeId;
}

/** Convenience alias: Tree = BuilderTree. */
export type Tree = BuilderTree;
