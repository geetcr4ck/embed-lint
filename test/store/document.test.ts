// Phase 2c store tests: add/update/move/remove/select, undo/redo,
// single-root enforcement plus minimal Section/Action Row rules.
import { beforeEach, describe, expect, it } from 'vitest';
import { toJson } from '../../lib/serializer/toJson';
import { useDocumentStore, type NodePatch } from '../../lib/store/document';
import {
  selectChildIds,
  selectComponentCount,
  selectSelectedNode,
} from '../../lib/store/selectors';

function api() {
  return useDocumentStore.getState();
}

function textContent(id: string): string {
  const node = api().doc.nodes[id];
  if (!node || node.type !== 10) throw new Error(`node ${id} is not a Text Display`);
  return node.content;
}

beforeEach(() => {
  api().reset();
});

describe('basic add/select + single root', () => {
  it('creates the root container', () => {
    const root = api().addNode(null, 17);
    expect(api().doc.rootId).toBe(root);
    expect(api().doc.nodes[root]?.type).toBe(17);
  });

  it('rejects a second container (single root)', () => {
    api().addNode(null, 17);
    expect(() => api().addNode(null, 17)).toThrowError(/ROOT_SINGLETON/);
  });

  it('rejects nested containers and parentless non-container nodes', () => {
    const root = api().addNode(null, 17);
    expect(() => api().addNode(root, 17)).toThrowError(/CONTAINER_ROOT_ONLY/);
    expect(() => api().addNode(null, 10)).toThrowError(/NEEDS_PARENT/);
    expect(() => api().addNode('missing-id', 10)).toThrowError(/PARENT_NOT_FOUND/);
  });

  it('select then clears selection', () => {
    const root = api().addNode(null, 17);
    const text = api().addNode(root, 10);
    api().select(text);
    expect(selectSelectedNode(api())?.id).toBe(text);
    api().select(null);
    expect(selectSelectedNode(api())).toBeUndefined();
  });

  it('addNode supports an insert index', () => {
    const root = api().addNode(null, 17);
    const a = api().addNode(root, 10);
    const b = api().addNode(root, 10);
    const mid = api().addNode(root, 14, 1);
    expect(selectChildIds(api(), root)).toEqual([a, mid, b]);
  });
});

describe('section and action row rules', () => {
  it('section: at most 3 texts + 1 accessory', () => {
    const root = api().addNode(null, 17);
    const sec = api().addNode(root, 9);
    api().addNode(sec, 10);
    api().addNode(sec, 10);
    api().addNode(sec, 10);
    expect(() => api().addNode(sec, 10)).toThrowError(/SECTION_SHAPE/);
    api().addNode(sec, 11);
    expect(() => api().addNode(sec, 2)).toThrowError(/SECTION_ACCESSORY_SINGLE/);
    expect(() => api().addNode(sec, 14)).toThrowError(/SECTION_SHAPE/);
  });

  it('action rows hold only buttons (max 5)', () => {
    const root = api().addNode(null, 17);
    const row = api().addNode(root, 1);
    expect(() => api().addNode(row, 10)).toThrowError(/ACTION_ROW_CHILD/);
    for (let i = 0; i < 5; i++) api().addNode(row, 2);
    expect(() => api().addNode(row, 2)).toThrowError(/ACTION_ROW_FULL/);
  });

  it('leaves cannot have children', () => {
    const root = api().addNode(null, 17);
    const text = api().addNode(root, 10);
    expect(() => api().addNode(text, 10)).toThrowError(/LEAF_NO_CHILDREN/);
  });
});

describe('updateNode', () => {
  it('scalar patch + undo/redo restores the value', () => {
    const root = api().addNode(null, 17);
    const text = api().addNode(root, 10);
    api().updateNode(text, { content: 'hello' }, 5000);
    expect(textContent(text)).toBe('hello');
    api().undo();
    expect(textContent(text)).toBe('');
    api().redo();
    expect(textContent(text)).toBe('hello');
  });

  it('rejects unknown ids and ignores structural keys', () => {
    expect(() => api().updateNode('missing', {}, 9000)).toThrowError(/NODE_NOT_FOUND/);
    const root = api().addNode(null, 17);
    const pastLen = api().doc.past.length;
    api().updateNode(root, { id: 'x', children: [] }, 9000);
    expect(api().doc.nodes[root]?.id).toBe(root);
    expect(api().doc.past.length).toBe(pastLen);
  });

  it('300ms debounce for text edits (timestamp param)', () => {
    const root = api().addNode(null, 17);
    const text = api().addNode(root, 10);
    const base = api().doc.past.length;
    api().updateNode(text, { content: 'a' }, 1000);
    expect(api().doc.past.length).toBe(base + 1);
    api().updateNode(text, { content: 'b' }, 1100);
    expect(api().doc.past.length).toBe(base + 1);
    api().updateNode(text, { content: 'c' }, 1500);
    expect(api().doc.past.length).toBe(base + 2);
    expect(textContent(text)).toBe('c');
    api().undo();
    expect(textContent(text)).toBe('b');
  });
});

describe('moveNode', () => {
  it('moves across parents + reorder + invalid targets stay safe', () => {
    const root = api().addNode(null, 17);
    const secA = api().addNode(root, 9);
    const secB = api().addNode(root, 9);
    const t1 = api().addNode(secA, 10);
    const t2 = api().addNode(secA, 10);
    api().moveNode(t1, secB);
    expect(selectChildIds(api(), secA)).toEqual([t2]);
    expect(selectChildIds(api(), secB)).toEqual([t1]);
    const t3 = api().addNode(secB, 10);
    api().moveNode(t3, secB, 0);
    expect(selectChildIds(api(), secB)).toEqual([t3, t1]);
    expect(() => api().moveNode(t3, t2)).toThrowError(/LEAF_NO_CHILDREN/);
    expect(selectChildIds(api(), secB)).toEqual([t3, t1]);
    expect(() => api().moveNode(root, secA)).toThrowError(/ROOT_IMMOVABLE/);
    expect(() => api().moveNode('missing', secA)).toThrowError(/NODE_NOT_FOUND/);
  });
});

describe('removeNode', () => {
  it('removes the subtree + clears selection and root', () => {
    const root = api().addNode(null, 17);
    const sec = api().addNode(root, 9);
    const t = api().addNode(sec, 10);
    const acc = api().addNode(sec, 2);
    api().select(acc);
    api().removeNode(sec);
    expect(api().doc.nodes[sec]).toBeUndefined();
    expect(api().doc.nodes[t]).toBeUndefined();
    expect(api().doc.nodes[acc]).toBeUndefined();
    expect(api().doc.selectedId).toBeNull();
    api().removeNode(root);
    expect(api().doc.rootId).toBeNull();
  });
});

describe('history undo/redo', () => {
  it('caps at 20 snapshots; undo/redo walks 20 steps', () => {
    api().addNode(null, 17);
    for (let i = 0; i < 25; i++) api().addNode(api().doc.rootId, 10);
    expect(api().doc.past.length).toBe(20);
    expect(selectComponentCount(api())).toBe(26);
    for (let i = 0; i < 20; i++) api().undo();
    expect(selectComponentCount(api())).toBe(6);
    api().undo();
    expect(selectComponentCount(api())).toBe(6);
    for (let i = 0; i < 20; i++) api().redo();
    expect(selectComponentCount(api())).toBe(26);
    api().redo();
    expect(selectComponentCount(api())).toBe(26);
  });

  it('a fresh mutation drops the future', () => {
    const root = api().addNode(null, 17);
    const a = api().addNode(root, 10);
    api().undo();
    expect(api().doc.future.length).toBe(1);
    api().addNode(root, 14);
    expect(api().doc.future.length).toBe(0);
    expect(api().doc.nodes[a]).toBeUndefined();
    api().redo();
    expect(api().doc.nodes[a]).toBeUndefined();
  });
});

describe('snapshot export/import', () => {
  it('round-trip via exportSnapshot/importSnapshot', () => {
    const root = api().addNode(null, 17);
    const text = api().addNode(root, 10);
    api().updateNode(text, { content: 'persist' }, 20000);
    const snap = api().exportSnapshot();
    api().reset();
    expect(selectComponentCount(api())).toBe(0);
    api().importSnapshot(snap);
    expect(api().doc.rootId).toBe(root);
    expect(textContent(text)).toBe('persist');
    expect(() => api().importSnapshot('not json')).toThrowError(/SNAPSHOT_INVALID/);
  });
});

describe('canonical lib/serializer/types.ts unification', () => {
  it('thumbnail description/spoiler REJECTED: updateNode ignores them', () => {
    const root = api().addNode(null, 17);
    const thumb = api().addNode(root, 11);
    const pastLen = api().doc.past.length;
    // Invalid patch passes via JSON.parse (any), no `as`, per AGENTS.md §2.
    const patch: NodePatch = JSON.parse('{"description":"unsupported","spoiler":true}');
    api().updateNode(thumb, patch, 30000);
    const node = api().doc.nodes[thumb];
    expect(node?.type).toBe(11);
    expect(node && 'description' in node).toBe(false);
    expect(node && 'spoiler' in node).toBe(false);
    expect(api().doc.past.length).toBe(pastLen);
  });

  it('thumbnail description/spoiler REJECTED: importSnapshot drops them', () => {
    const root = api().addNode(null, 17);
    const thumb = api().addNode(root, 11);
    const raw: { nodes: Record<string, Record<string, unknown>> } = JSON.parse(
      api().exportSnapshot(),
    );
    const thumbRec = raw.nodes[thumb];
    if (!thumbRec) throw new Error('thumb missing from snapshot');
    thumbRec.description = 'unsupported';
    thumbRec.spoiler = true;
    api().importSnapshot(JSON.stringify(raw));
    const node = api().doc.nodes[thumb];
    expect(node?.type).toBe(11);
    expect(node && 'description' in node).toBe(false);
    expect(node && 'spoiler' in node).toBe(false);
  });

  it('store trees feed the serializer directly (toJson/fromJson round-trip)', () => {
    const root = api().addNode(null, 17);
    const sec = api().addNode(root, 9);
    api().addNode(sec, 10);
    const thumb = api().addNode(sec, 11);
    api().updateNode(thumb, { url: 'https://example.com/a.png' }, 40000);
    const rootId = api().doc.rootId;
    if (rootId === null) throw new Error('root is missing');
    const payload = toJson({ nodes: api().doc.nodes, rootId });
    const section = payload.component.components[0];
    if (!section || section.type !== 9) throw new Error('section missing from payload');
    expect(section.accessory).toEqual({
      type: 11,
      media: { url: 'https://example.com/a.png' },
    });
  });
});
