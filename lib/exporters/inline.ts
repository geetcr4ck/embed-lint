// Ref: ARCH §9.1 - inline exporter.
// Pure: no React, no `any`.

import type { DiscordPayload } from '../schema/payload';

/**
 * Payload to <script> snippet for inline embeds.
 */
export function toInlineSnippet(payload: DiscordPayload): string {
  const json = JSON.stringify(payload);
  return `<script id="discord:component-embed" type="application/json">\n${json}\n</script>`;
}
