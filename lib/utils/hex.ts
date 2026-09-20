import { ACCENT_COLOR_MAX, ACCENT_COLOR_MIN } from '../schema/constants';

// Hex accent color to integer conversion (ARCH §5: accentColor is an integer).
// Pure: no React/DOM, no `any`.

const HEX_BODY_PATTERN = /^[0-9a-fA-F]{6}$/;

/** "5865F2" / "#5865F2" to integer. Throws unless 6 hex digits. */
export function hexToInt(hex: string): number {
  const body = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!HEX_BODY_PATTERN.test(body)) {
    throw new Error(`Invalid hex: "${hex}". Use 6 hex digits, e.g. "#5865F2".`);
  }
  return parseInt(body, 16);
}

/** Integer to lowercase 6-digit "#rrggbb". Throws outside 0..16777215. */
export function intToHex(value: number): string {
  if (!Number.isInteger(value) || value < ACCENT_COLOR_MIN || value > ACCENT_COLOR_MAX) {
    throw new Error(`Accent color must be an integer from ${ACCENT_COLOR_MIN} to ${ACCENT_COLOR_MAX}.`);
  }
  return `#${value.toString(16).padStart(6, '0')}`;
}
