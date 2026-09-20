// Ref: PRD.md §5.3, ARCHITECTURE.md §7.3.
// Single source of truth for Discord payload numeric limits and key whitelists.

/** Total components in one payload (root through all descendants). */
export const MAX_COMPONENTS = 40;

/** Raw-byte JSON limit for linked mode (measured via byteSize, not str.length). */
export const MAX_LINKED_BYTES = 3000;

/** Maximum media/button URL length. */
export const MAX_URL_LENGTH = 2048;

/** Supported component types (read-only subset). */
export const ALLOWED_TYPES = [1, 2, 9, 10, 11, 12, 14, 17] as const;
export type ComponentType = (typeof ALLOWED_TYPES)[number];

/** Allowed Button keys (BUTTON_KEYS, §17). */
export const BUTTON_ALLOWED_KEYS = ['type', 'url', 'style', 'label', 'emoji', 'disabled'] as const;

/** Thumbnail media formats (MEDIA_FORMAT, §18). "jpg" counts as JPEG. */
export const THUMBNAIL_FORMATS = ['png', 'gif', 'jpeg', 'jpg', 'webp', 'avif'] as const;

/** Media Gallery formats: thumbnails plus video (MEDIA_FORMAT, §18). */
export const GALLERY_FORMATS = [...THUMBNAIL_FORMATS, 'mp4', 'mov', 'webm'] as const;

/** Container accent_color range (integer). */
export const ACCENT_COLOR_MIN = 0;
export const ACCENT_COLOR_MAX = 16777215;
