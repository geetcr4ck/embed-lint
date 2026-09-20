import { describe, expect, it } from 'vitest';
import { fromJson } from '../../lib/serializer/fromJson';
import { toJson } from '../../lib/serializer/toJson';
import type { Tree } from '../../lib/serializer/types';

// Ref: ARCH §8 - round-trip fromJson(toJson(x)) === x (ids excluded).

function makeFullTree(): Tree {
  return {
    rootId: 'root',
    nodes: {
      root: {
        id: 'root',
        type: 17,
        accentColor: 0x5865f2,
        spoiler: false,
        children: ['t1', 'btn1', 'thumb1', 'gal1', 'sep1', 'sec1', 'row1'],
      },
      t1: { id: 't1', type: 10, parentId: 'root', content: '# Hello' },
      btn1: {
        id: 'btn1',
        type: 2,
        parentId: 'root',
        style: 5,
        url: 'https://example.com/release',
        label: 'Open',
      },
      thumb1: { id: 'thumb1', type: 11, parentId: 'root', url: 'https://example.com/img.png' },
      gal1: {
        id: 'gal1',
        type: 12,
        parentId: 'root',
        items: [
          { url: 'https://example.com/v.mp4', description: 'Trailer', spoiler: true },
          { url: 'https://example.com/b.png' },
        ],
      },
      sep1: { id: 'sep1', type: 14, parentId: 'root', divider: true, spacing: 1 },
      sec1: { id: 'sec1', type: 9, parentId: 'root', children: ['sec-text'], accessoryId: 'sec-btn' },
      'sec-text': { id: 'sec-text', type: 10, parentId: 'sec1', content: 'Section body' },
      'sec-btn': {
        id: 'sec-btn',
        type: 2,
        parentId: 'sec1',
        style: 5,
        url: 'https://example.com/action',
        label: 'Action',
        emoji: { name: '🎉' },
      },
      row1: { id: 'row1', type: 1, parentId: 'root', children: ['row-btn'] },
      'row-btn': {
        id: 'row-btn',
        type: 2,
        parentId: 'row1',
        style: 5,
        url: 'https://example.com/docs',
        label: 'Docs',
        disabled: true,
      },
    },
  };
}

describe('serializer round-trip', () => {
  it('fromJson(toJson(x)) then toJson again is identical (no ids)', () => {
    const tree = makeFullTree();
    const payload = toJson(tree);
    const imported = fromJson(payload);
    // ids are regenerated, so rootId differs, but the payload output matches.
    expect(imported.rootId).not.toBe(tree.rootId);
    expect(toJson(imported)).toEqual(payload);
  });

  it('accent_color integer survives', () => {
    const payload = toJson(makeFullTree());
    expect(payload.component.accent_color).toBe(0x5865f2);
    const imported = fromJson(payload);
    expect(toJson(imported).component.accent_color).toBe(0x5865f2);
  });

  it('button is always style 5 with undefined stripped', () => {
    const tree: Tree = {
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 17, children: ['b'] },
        b: { id: 'b', type: 2, parentId: 'root', style: 5, url: 'https://example.com/x' },
      },
    };
    const payload = toJson(tree);
    const btn = payload.component.components[0];
    expect(btn).toBeDefined();
    if (btn === undefined) throw new Error('Button missing from payload.');
    expect(btn).toEqual({ type: 2, style: 5, url: 'https://example.com/x' });
    expect('label' in btn).toBe(false);
    expect('emoji' in btn).toBe(false);
    expect('disabled' in btn).toBe(false);
  });

  it('internal fields (id/parentId/children/accessoryId/accentColor) are dropped', () => {
    const raw = JSON.stringify(toJson(makeFullTree()));
    expect(raw).not.toContain('parentId');
    expect(raw).not.toContain('accessoryId');
    expect(raw).not.toContain('accentColor');
    expect(raw).not.toContain('"children"');
  });

  it('media items map to { media: { url }, description?, spoiler? }', () => {
    const payload = toJson(makeFullTree());
    const gallery = payload.component.components.find((c) => c.type === 12);
    expect(gallery).toEqual({
      type: 12,
      items: [
        {
          media: { url: 'https://example.com/v.mp4' },
          description: 'Trailer',
          spoiler: true,
        },
        { media: { url: 'https://example.com/b.png' } },
      ],
    });
    const thumb = payload.component.components.find((c) => c.type === 11);
    expect(thumb).toEqual({ type: 11, media: { url: 'https://example.com/img.png' } });
  });

  it('separator without optionals stays a clean { type: 14 }', () => {
    const tree: Tree = {
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 17, children: ['s'] },
        s: { id: 's', type: 14, parentId: 'root' },
      },
    };
    expect(toJson(tree)).toEqual({ component: { type: 17, components: [{ type: 14 }] } });
  });
});

describe('fromJson validation', () => {
  it('invalid import throws (empty root)', () => {
    expect(() => fromJson({})).toThrow();
  });

  it('invalid import throws (component is not a container)', () => {
    expect(() => fromJson({ component: { type: 10, content: 'Hello' } })).toThrow();
  });

  it('invalid import throws (button style != 5)', () => {
    expect(() =>
      fromJson({
        component: {
          type: 17,
          components: [{ type: 2, style: 4, url: 'https://example.com/x', label: 'X' }],
        },
      }),
    ).toThrow();
  });

  it('invalid import throws (extra key on button)', () => {
    expect(() =>
      fromJson({
        component: {
          type: 17,
          components: [
            { type: 2, style: 5, url: 'https://example.com/x', label: 'X', custom_id: 'click' },
          ],
        },
      }),
    ).toThrow();
  });

  it('toJson throws when the root is not a container', () => {
    const tree: Tree = {
      rootId: 't',
      nodes: { t: { id: 't', type: 10, content: 'Hello' } },
    };
    expect(() => toJson(tree)).toThrow();
  });

  it('toJson throws on broken child references', () => {
    const tree: Tree = {
      rootId: 'root',
      nodes: { root: { id: 'root', type: 17, children: ['missing'] } },
    };
    expect(() => toJson(tree)).toThrow();
  });
});
