import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validator';

// Ref: §17 - whitelisted container children; sections hold 1-3 texts plus an accessory.
// Ref: §15/§9 - accent_color is an integer from 0 to 16777215.
function containerWith(children: unknown[]): unknown {
  return { component: { type: 17, components: children } };
}

const text = { type: 10, content: 'Hello' };
const button = { type: 2, style: 5, url: 'https://example.com/', label: 'Open' };
const thumbnail = { type: 11, media: { url: 'https://cdn.test/a.png' } };

describe('CONTAINER_CHILD_TYPE', () => {
  it('valid: every allowed child type', () => {
    const result = validate(
      containerWith([
        text,
        { type: 1, components: [button] },
        { type: 9, components: [text], accessory: thumbnail },
        { type: 12, items: [{ media: { url: 'https://cdn.test/a.png' } }] },
        { type: 14, divider: true },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it('invalid: button directly in container', () => {
    const result = validate(containerWith([button]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'CONTAINER_CHILD_TYPE')).toBe(true);
  });

  it('invalid: thumbnail directly in container', () => {
    const result = validate(containerWith([thumbnail]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'CONTAINER_CHILD_TYPE')).toBe(true);
  });

  it('invalid: nested container', () => {
    const result = validate(containerWith([{ type: 17, components: [] }]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'CONTAINER_CHILD_TYPE')).toBe(true);
  });

  it('invalid: unknown type (3)', () => {
    const result = validate(containerWith([{ type: 3 }]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'CONTAINER_CHILD_TYPE')).toBe(true);
  });
});

describe('SECTION_SHAPE', () => {
  it('valid: 2 texts + button accessory', () => {
    const result = validate(
      containerWith([{ type: 9, components: [text, text], accessory: button }]),
    );
    expect(result.ok).toBe(true);
  });

  it('invalid: section with no text display', () => {
    const result = validate(containerWith([{ type: 9, components: [] }]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'SECTION_SHAPE')).toBe(true);
  });

  it('invalid: 4 text displays', () => {
    const result = validate(containerWith([{ type: 9, components: [text, text, text, text] }]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'SECTION_SHAPE')).toBe(true);
  });

  it('invalid: text display accessory', () => {
    const result = validate(containerWith([{ type: 9, components: [text], accessory: text }]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'SECTION_SHAPE')).toBe(true);
  });
});

describe('ACCENT_COLOR', () => {
  it('valid: boundary 0 and 16777215', () => {
    expect(
      validate({ component: { type: 17, accent_color: 0, components: [] } }).ok,
    ).toBe(true);
    expect(
      validate({ component: { type: 17, accent_color: 16777215, components: [] } }).ok,
    ).toBe(true);
  });

  it('invalid: negative', () => {
    const result = validate({ component: { type: 17, accent_color: -1, components: [] } });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ACCENT_COLOR')).toBe(true);
  });

  it('invalid: above maximum', () => {
    const result = validate({ component: { type: 17, accent_color: 16777216, components: [] } });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ACCENT_COLOR')).toBe(true);
  });

  it('invalid: float', () => {
    const result = validate({ component: { type: 17, accent_color: 1.5, components: [] } });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ACCENT_COLOR')).toBe(true);
  });
});
