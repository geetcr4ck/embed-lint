// Ref: ARCH §7.4 - the 3,000 byte limit is measured in raw bytes,
// not str.length. Pure: no React/DOM, no `any`.
export function byteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}
