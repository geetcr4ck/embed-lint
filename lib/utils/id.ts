// Internal tree node ids (never part of the exported payload).
// nanoid-like with no new deps: crypto.randomUUID when available, counter fallback.
// Pure: no React/DOM, no `any`.

let counter = 0;

export function createId(prefix = 'node'): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
