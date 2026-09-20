import { describe, expect, it } from 'vitest';
import { byteSize } from '../../lib/validator/byteSize';
import { validate } from '../../lib/validator';

// validate() contract: ok, issues, stats.
describe('validate', () => {
  it('valid payload: ok plus exact issues and stats', () => {
    const payload = {
      component: {
        type: 17,
        accent_color: 0x5865f2,
        components: [
          { type: 10, content: 'Hello' },
          {
            type: 9,
            components: [{ type: 10, content: 'Headline' }],
            accessory: { type: 11, media: { url: 'https://cdn.test/a.png' } },
          },
          {
            type: 12,
            items: [
              { media: { url: 'https://cdn.test/b.png' } },
              { media: { url: 'https://cdn.test/c.mp4' } },
            ],
          },
          {
            type: 1,
            components: [{ type: 2, style: 5, url: 'https://example.com/', label: 'Open' }],
          },
        ],
      },
    };
    const result = validate(payload);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
    // root + text + section + section-text + thumbnail + gallery + action-row + button = 8
    expect(result.stats.componentCount).toBe(8);
    expect(result.stats.rawBytes).toBe(byteSize(JSON.stringify(payload)));
    // thumbnail 1 + gallery 2 items = 3 (buttons are not counted)
    expect(result.stats.totalMediaUrls).toBe(3);
  });

  it('invalid payload: ok is false but stats are still filled', () => {
    const result = validate({ component: { type: 17, components: [{ type: 3 }] } });
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.stats.rawBytes).toBeGreaterThan(0);
    expect(result.stats.componentCount).toBeGreaterThan(0);
  });

  it('every issue has path + message + hint', () => {
    const result = validate({ component: { type: 17, components: [{ type: 3 }] } });
    for (const issue of result.issues) {
      expect(Array.isArray(issue.path)).toBe(true);
      expect(issue.message.length).toBeGreaterThan(0);
      expect(issue.hint?.length).toBeGreaterThan(0);
      expect(issue.code).toMatch(/^[A-Z_]+$/);
    }
  });
});
