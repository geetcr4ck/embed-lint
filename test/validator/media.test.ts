import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validator';

// Ref: §18 - media { url }, URLs at most 2,048 chars, format whitelist, no fetching.
function containerWith(children: unknown[]): unknown {
  return { component: { type: 17, components: children } };
}

const png = 'https://cdn.test/img.png';
const text = { type: 10, content: 'Caption' };

function sectionWithThumbnail(media: unknown): unknown {
  return { type: 9, components: [text], accessory: { type: 11, media } };
}

describe('MEDIA_SHAPE', () => {
  it('valid: thumbnail + gallery item', () => {
    const result = validate(
      containerWith([
        sectionWithThumbnail({ url: png }),
        { type: 12, items: [{ media: { url: png }, description: 'Caption' }] },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it('invalid: extra key in thumbnail media', () => {
    const result = validate(containerWith([sectionWithThumbnail({ url: png, foo: 'x' })]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MEDIA_SHAPE')).toBe(true);
  });

  it('invalid: extra key in gallery item', () => {
    const result = validate(
      containerWith([{ type: 12, items: [{ media: { url: png }, width: 100 }] }]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MEDIA_SHAPE')).toBe(true);
  });
});

describe('MEDIA_URL_LENGTH', () => {
  const base = 'https://cdn.test/';
  const url2048 = `${base}${'a'.repeat(2048 - base.length - '.png'.length)}.png`;
  const url2049 = `${base}${'a'.repeat(2049 - base.length - '.png'.length)}.png`;

  it('valid: URL exactly 2,048 chars', () => {
    expect(url2048.length).toBe(2048);
    const result = validate(containerWith([sectionWithThumbnail({ url: url2048 })]));
    expect(result.ok).toBe(true);
  });

  it('invalid: 2,049-char URL (with no other format error)', () => {
    expect(url2049.length).toBe(2049);
    const result = validate(containerWith([sectionWithThumbnail({ url: url2049 })]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MEDIA_URL_LENGTH')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'MEDIA_FORMAT')).toBe(false);
  });
});

describe('MEDIA_FORMAT', () => {
  it('valid: mp4 in gallery', () => {
    const result = validate(
      containerWith([{ type: 12, items: [{ media: { url: 'https://cdn.test/v.mp4' } }] }]),
    );
    expect(result.ok).toBe(true);
  });

  it('invalid: .txt in thumbnail', () => {
    const result = validate(
      containerWith([sectionWithThumbnail({ url: 'https://cdn.test/a.txt' })]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MEDIA_FORMAT')).toBe(true);
  });

  it('invalid: mp4 in thumbnail (video is gallery-only)', () => {
    const result = validate(
      containerWith([sectionWithThumbnail({ url: 'https://cdn.test/v.mp4' })]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'MEDIA_FORMAT')).toBe(true);
  });
});
