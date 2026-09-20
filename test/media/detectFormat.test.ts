import { describe, expect, it } from 'vitest';
import { detectFormat, getExtension, isSupportedFormat } from '../../lib/media/detectFormat';

// MEDIA_FORMAT (§18): thumbnail png/gif/jpeg/webp/avif,
// gallery adds mp4/mov/webm. No fetching.
describe('detectFormat', () => {
  it('valid thumbnail extensions (lowercase)', () => {
    expect(detectFormat('https://example.com/a.png', 'thumbnail')).toBe('png');
    expect(detectFormat('https://example.com/a.jpeg', 'thumbnail')).toBe('jpeg');
    expect(detectFormat('https://example.com/a.webp', 'thumbnail')).toBe('webp');
  });

  it('case-insensitive + strip query/hash', () => {
    expect(detectFormat('https://example.com/A.PNG?v=2#frag', 'thumbnail')).toBe('png');
  });

  it('video is gallery-only', () => {
    expect(detectFormat('https://example.com/v.mp4', 'gallery')).toBe('mp4');
    expect(detectFormat('https://example.com/v.mp4', 'thumbnail')).toBeUndefined();
    expect(detectFormat('https://example.com/v.mov', 'gallery')).toBe('mov');
    expect(detectFormat('https://example.com/v.webm', 'gallery')).toBe('webm');
  });

  it('invalid: unsupported format / no extension', () => {
    expect(detectFormat('https://example.com/a.txt', 'thumbnail')).toBeUndefined();
    expect(detectFormat('https://example.com/no-extension', 'gallery')).toBeUndefined();
  });

  it('data URL: supported vs unsupported mime', () => {
    expect(detectFormat('data:image/png;base64,iVBORw0KGgo=', 'thumbnail')).toBe('png');
    expect(detectFormat('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 'thumbnail')).toBeUndefined();
  });

  it('getExtension + isSupportedFormat agree', () => {
    expect(getExtension('https://example.com/a.gif')).toBe('gif');
    expect(getExtension('https://example.com/dir/')).toBeUndefined();
    expect(isSupportedFormat('https://example.com/a.avif', 'thumbnail')).toBe(true);
    expect(isSupportedFormat('https://example.com/a.avif', 'gallery')).toBe(true);
    expect(isSupportedFormat('https://example.com/a.bmp', 'gallery')).toBe(false);
  });
});
