import { describe, expect, it } from 'vitest';
import { createId } from '../../lib/utils/id';

describe('createId', () => {
  it('unique across calls', () => {
    const ids = new Set([createId(), createId(), createId(), createId(), createId()]);
    expect(ids.size).toBe(5);
  });

  it('uses default and custom prefixes', () => {
    expect(createId().startsWith('node_')).toBe(true);
    expect(createId('btn').startsWith('btn_')).toBe(true);
  });
});
