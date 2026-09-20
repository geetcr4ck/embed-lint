import { describe, expect, it } from 'vitest';
import { hexToInt, intToHex } from '../../lib/utils/hex';

describe('hex accent color', () => {
  it('hexToInt: with and without #', () => {
    expect(hexToInt('#5865F2')).toBe(0x5865f2);
    expect(hexToInt('5865f2')).toBe(0x5865f2);
  });

  it('hexToInt: rejects bad formats', () => {
    expect(() => hexToInt('zzz')).toThrow();
    expect(() => hexToInt('#12345')).toThrow();
    expect(() => hexToInt('')).toThrow();
  });

  it('intToHex: 6-digit lowercase + #', () => {
    expect(intToHex(0)).toBe('#000000');
    expect(intToHex(16777215)).toBe('#ffffff');
    expect(intToHex(0x5865f2)).toBe('#5865f2');
  });

  it('intToHex: rejects out-of-range values and non-integers', () => {
    expect(() => intToHex(-1)).toThrow();
    expect(() => intToHex(16777216)).toThrow();
    expect(() => intToHex(1.5)).toThrow();
  });

  it('round-trip hex to int to hex', () => {
    expect(intToHex(hexToInt('#5865F2'))).toBe('#5865f2');
  });

  it('round-trip int to hex to int', () => {
    expect(hexToInt(intToHex(123456))).toBe(123456);
  });
});
