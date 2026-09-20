// Ref: ARCH §9.2 - linked exporter (snippet plus JSON file plus byte-limit check).
// The 3000 byte limit is measured via byteSize (TextEncoder), not str.length.

import { MAX_LINKED_BYTES } from '../schema/constants';
import type { DiscordPayload } from '../schema/payload';
import { byteSize } from '../validator/byteSize';

/**
 * JSON file URL to <link> snippet for linked embeds.
 */
export function toLinkedSnippet(url: string): string {
  return `<link\n  rel="discord:component-embed"\n  type="application/json"\n  href="${url}"\n>`;
}

/**
 * Payload to JSON file Blob (application/json type) for download/hosting.
 */
export function toLinkedJsonFile(payload: DiscordPayload): Blob {
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

/**
 * True when the payload exceeds the linked limit (3000 bytes).
 * The UI shows a strong warning and disables the copy button when true.
 */
export function isOverLinkedLimit(payload: DiscordPayload): boolean {
  return byteSize(JSON.stringify(payload)) > MAX_LINKED_BYTES;
}
