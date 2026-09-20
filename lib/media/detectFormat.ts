import { GALLERY_FORMATS, THUMBNAIL_FORMATS } from '../schema/constants';

// Detect media format from URL extension or data URL, without fetching
// (ARCH §16: never fetch user URLs). Pure: no React/DOM, no `any`.

export type MediaKind = 'thumbnail' | 'gallery';

const DATA_URL_PATTERN = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+)/;

function stripUrlSuffix(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

/** Lowercase extension from a URL / data URL, or undefined when absent. */
export function getExtension(url: string): string | undefined {
  const dataMatch = DATA_URL_PATTERN.exec(url);
  if (dataMatch?.[1] !== undefined) {
    const subtype = dataMatch[1].split('/')[1];
    return subtype?.toLowerCase();
  }
  const clean = stripUrlSuffix(url).toLowerCase();
  const dotIndex = clean.lastIndexOf('.');
  const slashIndex = clean.lastIndexOf('/');
  if (dotIndex < 0 || dotIndex < slashIndex) {
    return undefined;
  }
  const ext = clean.slice(dotIndex + 1);
  return ext === '' ? undefined : ext;
}

/**
 * The extension when it is whitelisted for the media kind (MEDIA_FORMAT, §18),
 * or undefined when unsupported / extensionless.
 */
export function detectFormat(url: string, kind: MediaKind): string | undefined {
  const ext = getExtension(url);
  if (ext === undefined) {
    return undefined;
  }
  const allowed: readonly string[] = kind === 'gallery' ? GALLERY_FORMATS : THUMBNAIL_FORMATS;
  return allowed.some((format) => format === ext) ? ext : undefined;
}

export function isSupportedFormat(url: string, kind: MediaKind): boolean {
  return detectFormat(url, kind) !== undefined;
}
