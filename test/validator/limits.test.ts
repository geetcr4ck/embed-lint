import { describe, expect, it } from 'vitest';
import { byteSize } from '../../lib/validator/byteSize';
import { validate } from '../../lib/validator';

function texts(count: number): unknown[] {
  return Array.from({ length: count }, (_, index) => ({ type: 10, content: `t${index}` }));
}

function payloadWith(children: unknown[]): unknown {
  return { component: { type: 17, components: children } };
}

// Ref: §17 - at most 40 total. Ref: §15 - JSON at most 3,000 raw bytes.
describe('MAX_COMPONENTS', () => {
  it('valid: exactly 40 total (root + 39)', () => {
    const result = validate(payloadWith(texts(39)));
    expect(result.ok).toBe(true);
    expect(result.stats.componentCount).toBe(40);
  });

  it('invalid: 41 total (root + 40)', () => {
    const result = validate(payloadWith(texts(40)));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MAX_COMPONENTS')).toBe(true);
    expect(result.stats.componentCount).toBe(41);
  });

  it('invalid: 41 child components (42 total)', () => {
    const result = validate(payloadWith(texts(41)));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MAX_COMPONENTS')).toBe(true);
    expect(result.stats.componentCount).toBe(42);
  });
});

describe('MAX_BYTES', () => {
  it('valid: small payload', () => {
    const payload = payloadWith([{ type: 10, content: 'Hello' }]);
    const result = validate(payload);
    expect(result.ok).toBe(true);
    expect(result.stats.rawBytes).toBe(byteSize(JSON.stringify(payload) ?? ''));
    expect(result.stats.rawBytes).toBeLessThanOrEqual(3000);
  });

  it('invalid: giant content over 3000 bytes', () => {
    const payload = payloadWith([{ type: 10, content: 'x'.repeat(3000) }]);
    const result = validate(payload);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MAX_BYTES')).toBe(true);
    expect(result.stats.rawBytes).toBeGreaterThan(3000);
  });

  it('invalid: multibyte bytes count too (emoji is 4 bytes)', () => {
    const payload = payloadWith([{ type: 10, content: '🎉'.repeat(800) }]);
    const result = validate(payload);
    expect(result.stats.rawBytes).toBeGreaterThan(3000);
    expect(result.issues.some((issue) => issue.code === 'MAX_BYTES')).toBe(true);
  });
});
