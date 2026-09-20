import { describe, expect, it } from 'vitest';
import { byteSize } from '../../lib/validator/byteSize';

// Ref: ARCH §7.4 - byte limit uses raw bytes (TextEncoder), not str.length.
describe('byteSize', () => {
  it('empty string = 0 bytes', () => {
    expect(byteSize('')).toBe(0);
  });

  it('ASCII = 1 byte per char', () => {
    expect(byteSize('hello')).toBe(5);
  });

  it('multibyte latin (é = 2 bytes)', () => {
    expect(byteSize('héllo')).toBe(6);
  });

  it('emoji (🎉 = 4 bytes, length 2)', () => {
    expect('🎉'.length).toBe(2);
    expect(byteSize('🎉')).toBe(4);
  });

  it('mixed ASCII + emoji', () => {
    expect(byteSize('a🎉b')).toBe(6);
  });
});
