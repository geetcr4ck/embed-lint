import type { DiscordComponent, DiscordContainer } from '../../schema/component';
import type { JsonPath } from './types';

// Payload traversal helpers. Pure: no React/DOM, no `any`, no `as`.

export interface ComponentEntry {
  node: DiscordComponent;
  path: JsonPath;
}

/** Depth-first walk from the root container (including the root itself). */
export function walkComponents(container: DiscordContainer): ComponentEntry[] {
  const entries: ComponentEntry[] = [];
  const visit = (node: DiscordComponent, path: JsonPath): void => {
    entries.push({ node, path });
    if (node.type === 1 || node.type === 17) {
      node.components.forEach((child, index) => {
        visit(child, [...path, 'components', index]);
      });
    } else if (node.type === 9) {
      node.components.forEach((child, index) => {
        visit(child, [...path, 'components', index]);
      });
      if (node.accessory !== undefined) {
        visit(node.accessory, [...path, 'accessory']);
      }
    }
  };
  visit(container, ['component']);
  return entries;
}

/** Total components including the root container. */
export function countComponents(container: DiscordContainer): number {
  return walkComponents(container).length;
}

/** Media URL count: thumbnails plus each gallery item (button URLs excluded). */
export function countMediaUrls(container: DiscordContainer): number {
  let total = 0;
  for (const { node } of walkComponents(container)) {
    if (node.type === 11) {
      total += 1;
    } else if (node.type === 12) {
      total += node.items.length;
    }
  }
  return total;
}

/** Keys in `keys` that are missing from `allowed`. */
export function findExtraKeys(keys: string[], allowed: readonly string[]): string[] {
  return keys.filter((key) => !allowed.includes(key));
}

// --- Defensive walkers for payloads that fail Zod parsing (best-effort stats).
// No `as`: narrowing via predicates plus `in`.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Count objects with a numeric `type` as a componentCount estimate. */
export function looseCountComponents(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((total, item) => total + looseCountComponents(item), 0);
  }
  if (!isRecord(value)) {
    return 0;
  }
  const self = typeof value['type'] === 'number' ? 1 : 0;
  let total = self;
  for (const key of Object.keys(value)) {
    total += looseCountComponents(value[key]);
  }
  return total;
}

/** Count `{ media: { url: string } }` objects as a totalMediaUrls estimate. */
export function looseCountMediaUrls(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((total, item) => total + looseCountMediaUrls(item), 0);
  }
  if (!isRecord(value)) {
    return 0;
  }
  const media = value['media'];
  const self = isRecord(media) && typeof media['url'] === 'string' ? 1 : 0;
  let total = self;
  for (const key of Object.keys(value)) {
    total += looseCountMediaUrls(value[key]);
  }
  return total;
}
