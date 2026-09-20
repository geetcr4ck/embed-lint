// Ref: DESIGN.md §10 (4 ready-made templates for the empty state).
// Templates are builder trees (not raw JSON) so they flow straight into
// the store via importSnapshot(templateSnapshot(t.build())).
// Pure: no React/DOM, no `any`.

import type { BuilderNode, NodeId } from './serializer/types';
import { createId } from './utils/id';

export interface TemplateTree {
  nodes: Record<NodeId, BuilderNode>;
  rootId: NodeId;
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  build: () => TemplateTree;
}

interface Ctx {
  nodes: Record<NodeId, BuilderNode>;
}

function addContainer(ctx: Ctx, opts?: { accentColor?: number }): NodeId {
  const id = createId('container');
  const node: BuilderNode = { id, type: 17, children: [] };
  if (opts?.accentColor !== undefined) node.accentColor = opts.accentColor;
  ctx.nodes[id] = node;
  return id;
}

function pushChild(ctx: Ctx, parent: NodeId, child: NodeId): void {
  const parentNode = ctx.nodes[parent];
  if (parentNode?.type === 17 || parentNode?.type === 9 || parentNode?.type === 1) {
    parentNode.children.push(child);
  }
}

function addText(ctx: Ctx, parent: NodeId, content: string): NodeId {
  const id = createId('text');
  ctx.nodes[id] = { id, type: 10, parentId: parent, content };
  pushChild(ctx, parent, id);
  return id;
}

function addSeparator(ctx: Ctx, parent: NodeId): NodeId {
  const id = createId('separator');
  ctx.nodes[id] = { id, type: 14, parentId: parent, divider: true, spacing: 1 };
  pushChild(ctx, parent, id);
  return id;
}

function addActionRow(ctx: Ctx, parent: NodeId): NodeId {
  const id = createId('actionrow');
  ctx.nodes[id] = { id, type: 1, parentId: parent, children: [] };
  pushChild(ctx, parent, id);
  return id;
}

function addButton(ctx: Ctx, parent: NodeId, url: string, label: string): NodeId {
  const id = createId('button');
  ctx.nodes[id] = { id, type: 2, parentId: parent, style: 5, url, label };
  pushChild(ctx, parent, id);
  return id;
}

function addSection(ctx: Ctx, parent: NodeId): NodeId {
  const id = createId('section');
  ctx.nodes[id] = { id, type: 9, parentId: parent, children: [] };
  pushChild(ctx, parent, id);
  return id;
}

function addThumbnailAccessory(ctx: Ctx, section: NodeId, url: string): NodeId {
  const id = createId('thumbnail');
  ctx.nodes[id] = { id, type: 11, parentId: section, url };
  const sectionNode = ctx.nodes[section];
  if (sectionNode?.type === 9) sectionNode.accessoryId = id;
  return id;
}

function addButtonAccessory(ctx: Ctx, section: NodeId, url: string, label: string): NodeId {
  const id = createId('button');
  ctx.nodes[id] = { id, type: 2, parentId: section, style: 5, url, label };
  const sectionNode = ctx.nodes[section];
  if (sectionNode?.type === 9) sectionNode.accessoryId = id;
  return id;
}

function addGallery(ctx: Ctx, parent: NodeId, urls: string[]): NodeId {
  const id = createId('gallery');
  ctx.nodes[id] = {
    id,
    type: 12,
    parentId: parent,
    items: urls.map((url) => ({ url })),
  };
  pushChild(ctx, parent, id);
  return id;
}

function buildPatchNotes(): TemplateTree {
  const ctx: Ctx = { nodes: {} };
  const root = addContainer(ctx, { accentColor: 0x5865f2 });
  addText(ctx, root, '# Patch Notes\n- Fixed login bug\n- Faster load times');
  addSeparator(ctx, root);
  const row = addActionRow(ctx, root);
  addButton(ctx, row, 'https://example.com/patch', 'Read');
  addButton(ctx, row, 'https://example.com/download', 'Download');
  return { nodes: ctx.nodes, rootId: root };
}

function buildGameRelease(): TemplateTree {
  const ctx: Ctx = { nodes: {} };
  const root = addContainer(ctx, { accentColor: 0x23a55a });
  const section = addSection(ctx, root);
  addText(ctx, section, '# New Release: Version 2.0');
  addButtonAccessory(ctx, section, 'https://example.com/play', 'Play');
  addGallery(ctx, root, [
    'https://example.com/screenshot-1.png',
    'https://example.com/screenshot-2.png',
    'https://example.com/screenshot-3.png',
  ]);
  addText(ctx, root, 'Replace the three images above with your own URLs.');
  addSeparator(ctx, root);
  const row = addActionRow(ctx, root);
  addButton(ctx, row, 'https://example.com/download', 'Download');
  return { nodes: ctx.nodes, rootId: root };
}

function buildAnnouncement(): TemplateTree {
  const ctx: Ctx = { nodes: {} };
  const root = addContainer(ctx, { accentColor: 0xf0b232 });
  addText(ctx, root, '# Announcement');
  addSeparator(ctx, root);
  addText(ctx, root, 'Write the announcement here. Short and clear.');
  addButton(ctx, root, 'https://example.com/info', 'Learn more');
  return { nodes: ctx.nodes, rootId: root };
}

function buildSpoilerReveal(): TemplateTree {
  // The schema only allows spoiler on text (markdown ||...||) and gallery
  // items; Thumbnails have no spoiler field, so the spoiler uses text.
  const ctx: Ctx = { nodes: {} };
  const root = addContainer(ctx, { accentColor: 0x5865f2 });
  const section = addSection(ctx, root);
  addText(ctx, section, 'Click to reveal: ||secret prize||');
  addThumbnailAccessory(ctx, section, 'https://example.com/surprise.png');
  return { nodes: ctx.nodes, rootId: root };
}

export const TEMPLATES: TemplateDef[] = [
  { id: 'patch-notes', name: 'Patch Notes', description: 'Text, separator, 2 buttons.', build: buildPatchNotes },
  { id: 'game-release', name: 'Game Release', description: 'Section, 3-image gallery, actions.', build: buildGameRelease },
  { id: 'announcement', name: 'Announcement', description: 'Heading, body, 1 button.', build: buildAnnouncement },
  { id: 'spoiler-reveal', name: 'Spoiler Reveal', description: 'Spoiler text and thumbnail.', build: buildSpoilerReveal },
];

/** TemplateTree to snapshot string for the store importSnapshot(). */
export function templateSnapshot(tree: TemplateTree): string {
  return JSON.stringify({ version: 1, nodes: tree.nodes, rootId: tree.rootId });
}
