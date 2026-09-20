// Ref: ARCH §8.1 - toJson(tree): walk from rootId, convert to a Discord payload.
// - Drop internal fields (id, parentId, children, accessoryId).
// - accentColor is stored directly as an integer, becoming accent_color.
// - Media item becomes { media: { url }, description?, spoiler? }.
// - Button becomes { type: 2, style: 5, url, label?, emoji?, disabled? } (undefined stripped).
// Pure: no React/DOM, no `any`.

import type {
  DiscordActionRow,
  DiscordButton,
  DiscordContainer,
  DiscordMediaGallery,
  DiscordSection,
  DiscordSeparator,
  DiscordTextDisplay,
  DiscordThumbnail,
} from '../schema/component';
import type { DiscordPayload } from '../schema/payload';
import type {
  ActionRowNode,
  BuilderNode,
  ButtonNode,
  ContainerNode,
  MediaGalleryNode,
  NodeId,
  SectionNode,
  SeparatorNode,
  ThumbnailNode,
  Tree,
} from './types';

function getNode(tree: Tree, id: NodeId): BuilderNode {
  const node = tree.nodes[id];
  if (node === undefined) {
    throw new Error(`Node not found: "${id}".`);
  }
  return node;
}

function serializeButton(node: ButtonNode): DiscordButton {
  return {
    type: 2,
    style: 5,
    url: node.url,
    ...(node.label !== undefined ? { label: node.label } : {}),
    ...(node.emoji !== undefined
      ? {
          emoji: {
            name: node.emoji.name,
            ...(node.emoji.id !== undefined ? { id: node.emoji.id } : {}),
            ...(node.emoji.animated !== undefined ? { animated: node.emoji.animated } : {}),
          },
        }
      : {}),
    ...(node.disabled !== undefined ? { disabled: node.disabled } : {}),
  };
}

function serializeThumbnail(node: ThumbnailNode): DiscordThumbnail {
  return {
    type: 11,
    media: { url: node.url },
  };
}

function serializeTextDisplay(content: string): DiscordTextDisplay {
  return { type: 10, content };
}

function serializeSeparator(node: SeparatorNode): DiscordSeparator {
  return {
    type: 14,
    ...(node.divider !== undefined ? { divider: node.divider } : {}),
    ...(node.spacing !== undefined ? { spacing: node.spacing } : {}),
  };
}

function serializeGallery(node: MediaGalleryNode): DiscordMediaGallery {
  return {
    type: 12,
    items: node.items.map((item) => ({
      media: { url: item.url },
      ...(item.description !== undefined ? { description: item.description } : {}),
      ...(item.spoiler !== undefined ? { spoiler: item.spoiler } : {}),
    })),
  };
}

function serializeSection(node: SectionNode, tree: Tree): DiscordSection {
  const texts: DiscordTextDisplay[] = [];
  for (const childId of node.children) {
    const child = getNode(tree, childId);
    if (child.type !== 10) {
      throw new Error(
        `Section child must be Text Display (type 10), got type ${child.type} at "${childId}".`,
      );
    }
    texts.push(serializeTextDisplay(child.content));
  }

  if (node.accessoryId !== undefined) {
    const accessory = getNode(tree, node.accessoryId);
    if (accessory.type === 11) {
      return {
        type: 9,
        components: texts,
        accessory: serializeThumbnail(accessory),
      };
    }
    if (accessory.type === 2) {
      return {
        type: 9,
        components: texts,
        accessory: serializeButton(accessory),
      };
    }
    throw new Error(
      `Section accessory must be Thumbnail (11) or Button (2), got type ${accessory.type} at "${node.accessoryId}".`,
    );
  }

  return { type: 9, components: texts };
}

function serializeActionRow(node: ActionRowNode, tree: Tree): DiscordActionRow {
  const buttons: DiscordButton[] = [];
  for (const childId of node.children) {
    const child = getNode(tree, childId);
    if (child.type !== 2) {
      throw new Error(
        `Action Row child must be Button (type 2), got type ${child.type} at "${childId}".`,
      );
    }
    buttons.push(serializeButton(child));
  }
  return { type: 1, components: buttons };
}

function serializeContainer(node: ContainerNode, tree: Tree): DiscordContainer {
  const components: DiscordContainer['components'] = [];
  for (const childId of node.children) {
    const child = getNode(tree, childId);
    switch (child.type) {
      case 10:
        components.push(serializeTextDisplay(child.content));
        break;
      case 2:
        components.push(serializeButton(child));
        break;
      case 11:
        components.push(serializeThumbnail(child));
        break;
      case 12:
        components.push(serializeGallery(child));
        break;
      case 14:
        components.push(serializeSeparator(child));
        break;
      case 9:
        components.push(serializeSection(child, tree));
        break;
      case 1:
        components.push(serializeActionRow(child, tree));
        break;
      case 17:
        // Ref: §17 - Containers cannot nest.
        throw new Error(`Containers cannot nest (node "${childId}").`);
    }
  }

  return {
    type: 17,
    ...(node.accentColor !== undefined ? { accent_color: node.accentColor } : {}),
    ...(node.spoiler !== undefined ? { spoiler: node.spoiler } : {}),
    components,
  };
}

/**
 * Tree to DiscordPayload (§5.2).
 * Throws when the root is missing, the root is not a Container, or child refs break.
 */
export function toJson(tree: Tree): DiscordPayload {
  const root = getNode(tree, tree.rootId);
  if (root.type !== 17) {
    throw new Error(`Root must be a Container (type 17), got type ${root.type}.`);
  }
  return { component: serializeContainer(root, tree) };
}
