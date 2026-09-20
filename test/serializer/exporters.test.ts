import { describe, expect, it } from 'vitest';
import { toInlineSnippet } from '../../lib/exporters/inline';
import { isOverLinkedLimit, toLinkedJsonFile, toLinkedSnippet } from '../../lib/exporters/linked';
import type { DiscordPayload } from '../../lib/schema/payload';

// Ref: ARCH §9 - inline/linked exporters.

const smallPayload: DiscordPayload = {
  component: {
    type: 17,
    accent_color: 0x5865f2,
    components: [{ type: 10, content: 'Hello' }],
  },
};

describe('inline exporter', () => {
  it('emits <script id="discord:component-embed"> holding JSON', () => {
    const snippet = toInlineSnippet(smallPayload);
    expect(snippet).toContain('<script id="discord:component-embed"');
    expect(snippet).toContain('type="application/json"');
    expect(snippet).toContain(JSON.stringify(smallPayload));
    expect(snippet.endsWith('</script>')).toBe(true);
  });
});

describe('linked exporter', () => {
  it('toLinkedSnippet includes the href url', () => {
    const url = 'https://cdn.example.com/embed.json';
    const snippet = toLinkedSnippet(url);
    expect(snippet).toContain('rel="discord:component-embed"');
    expect(snippet).toContain('type="application/json"');
    expect(snippet).toContain(`href="${url}"`);
  });

  it('toLinkedJsonFile becomes an application/json Blob holding the payload', async () => {
    const file = toLinkedJsonFile(smallPayload);
    expect(file).toBeInstanceOf(Blob);
    expect(file.type).toBe('application/json');
    const text = await file.text();
    expect(JSON.parse(text)).toEqual(smallPayload);
  });

  it('isOverLinkedLimit: small payload is false', () => {
    expect(isOverLinkedLimit(smallPayload)).toBe(false);
  });

  it('isOverLinkedLimit: payload over 3000 bytes is true', () => {
    const big: DiscordPayload = {
      component: {
        type: 17,
        components: [{ type: 10, content: 'x'.repeat(4000) }],
      },
    };
    expect(isOverLinkedLimit(big)).toBe(true);
  });
});
