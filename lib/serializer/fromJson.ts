// Ref: ARCH §8.2 - fromJson(payload): the inverse of toJson, for JSON import.
// Every node gets a fresh id via createId(). Input is validated via Zod parse.
// Pure: no React/DOM, no `any`, no `as`.

import { createId } from '../utils/id';
import type {
  DiscordActionRow,
  DiscordButton,
  DiscordComponent,
  DiscordMediaGallery,
  DiscordSection,
  DiscordSeparator,
  DiscordTextDisplay,
  DiscordThumbnail,
} from '../schema/component';
import { DiscordPayloadSchema } from '../schema/payload';
import type {
  BuilderNode,
  MediaGalleryItem,
  NodeId,
  Tree,
} from './types';

function appendText(
  comp: DiscordTextDisplay,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('text');
  const node: BuilderNode = {
    id,
    type: 10,
    parentId,
    content: comp.content,
  };
  nodes[id] = node;
  return id;
}

function appendButton(
  comp: DiscordButton,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('button');
  const node: BuilderNode = {
    id,
    type: 2,
    parentId,
    style: 5,
    url: comp.url,
    ...(comp.label !== undefined ? { label: comp.label } : {}),
    ...(comp.emoji !== undefined
      ? {
          emoji: {
            name: comp.emoji.name,
            ...(comp.emoji.id !== undefined ? { id: comp.emoji.id } : {}),
            ...(comp.emoji.animated !== undefined ? { animated: comp.emoji.animated } : {}),
          },
        }
      : {}),
    ...(comp.disabled !== undefined ? { disabled: comp.disabled } : {}),
  };
  nodes[id] = node;
  return id;
}

function appendThumbnail(
  comp: DiscordThumbnail,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('thumbnail');
  const node: BuilderNode = {
    id,
    type: 11,
    parentId,
    url: comp.media.url,
  };
  nodes[id] = node;
  return id;
}

function appendGallery(
  comp: DiscordMediaGallery,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('gallery');
  const items: MediaGalleryItem[] = comp.items.map((item) => ({
    url: item.media.url,
    ...(item.description !== undefined ? { description: item.description } : {}),
    ...(item.spoiler !== undefined ? { spoiler: item.spoiler } : {}),
  }));
  const node: BuilderNode = {
    id,
    type: 12,
    parentId,
    items,
  };
  nodes[id] = node;
  return id;
}

function appendSeparator(
  comp: DiscordSeparator,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('separator');
  const node: BuilderNode = {
    id,
    type: 14,
    parentId,
    ...(comp.divider !== undefined ? { divider: comp.divider } : {}),
    ...(comp.spacing !== undefined ? { spacing: comp.spacing } : {}),
  };
  nodes[id] = node;
  return id;
}

function appendSection(
  comp: DiscordSection,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('section');
  const node: BuilderNode = {
    id,
    type: 9,
    parentId,
    children: [],
  };
  nodes[id] = node;

  for (const text of comp.components) {
    const textId = appendText(text, id, nodes);
    if (node.type === 9) {
      node.children.push(textId);
    }
  }

  if (comp.accessory !== undefined) {
    const accessory = comp.accessory;
    const accessoryId =
      accessory.type === 11
        ? appendThumbnail(accessory, id, nodes)
        : appendButton(accessory, id, nodes);
    if (node.type === 9) {
      node.accessoryId = accessoryId;
    }
  }

  return id;
}

function appendActionRow(
  comp: DiscordActionRow,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  const id = createId('actionrow');
  const node: BuilderNode = {
    id,
    type: 1,
    parentId,
    children: [],
  };
  nodes[id] = node;

  for (const button of comp.components) {
    const buttonId = appendButton(button, id, nodes);
    if (node.type === 1) {
      node.children.push(buttonId);
    }
  }

  return id;
}

function appendComponent(
  comp: DiscordComponent,
  parentId: NodeId,
  nodes: Record<NodeId, BuilderNode>,
): NodeId {
  switch (comp.type) {
    case 10:
      return appendText(comp, parentId, nodes);
    case 2:
      return appendButton(comp, parentId, nodes);
    case 11:
      return appendThumbnail(comp, parentId, nodes);
    case 12:
      return appendGallery(comp, parentId, nodes);
    case 14:
      return appendSeparator(comp, parentId, nodes);
    case 9:
      return appendSection(comp, parentId, nodes);
    case 1:
      return appendActionRow(comp, parentId, nodes);
    case 17:
      // The schema forbids nested Containers; unreachable when parsing passes.
      throw new Error('Containers cannot nest.');
  }
}

/**
 * DiscordPayload to Tree. Validated via Zod; throws on invalid input.
 * Accepts `unknown` (a JSON.parse result) - no `as`, no React/DOM.
 */
export function fromJson(input: unknown): Tree {
  const payload = DiscordPayloadSchema.parse(input);
  const nodes: Record<NodeId, BuilderNode> = {};

  const rootId = createId('container');
  const root: BuilderNode = {
    id: rootId,
    type: 17,
    children: [],
    ...(payload.component.accent_color !== undefined
      ? { accentColor: payload.component.accent_color }
      : {}),
    ...(payload.component.spoiler !== undefined ? { spoiler: payload.component.spoiler } : {}),
  };
  nodes[rootId] = root;

  for (const comp of payload.component.components) {
    const childId = appendComponent(comp, rootId, nodes);
    if (root.type === 17) {
      root.children.push(childId);
    }
  }

  return { nodes, rootId };
}
