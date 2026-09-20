'use client';

// Ref: DESIGN.md §4.6 (status bar: n/40 components, bytes, valid status).
// Rendered below the canvas. Live region for counters.

import { MAX_COMPONENTS, MAX_LINKED_BYTES } from '@/lib/schema/constants';
import { useInspectedPayload } from './usePayload';

export default function StatusBar() {
  const { hasRoot, result } = useInspectedPayload();

  const count = result?.stats.componentCount ?? 0;
  const bytes = result?.stats.rawBytes ?? 0;
  const kb = (bytes / 1000).toFixed(1);
  const pct = bytes / MAX_LINKED_BYTES;

  const errors = result?.issues.filter((issue) => issue.severity === 'error').length ?? 0;
  const warnings = result?.issues.filter((issue) => issue.severity === 'warning').length ?? 0;

  const status = !hasRoot ? (
    <span className="text-[var(--text-muted)]">Empty</span>
  ) : errors > 0 ? (
    <span className="text-[var(--danger)]">
      {errors.toString()} errors
    </span>
  ) : warnings > 0 ? (
    <span className="text-[var(--warning)]">
      {warnings.toString()} warnings
    </span>
  ) : (
    <span className="text-[var(--success)]">Valid</span>
  );

  return (
    <p
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 text-xs text-[var(--text-secondary)]"
    >
      <span className={count > MAX_COMPONENTS ? 'text-[var(--danger)]' : undefined}>
        {count.toString()} / {MAX_COMPONENTS.toString()} components
      </span>
      <span
        className={
          pct > 1
            ? 'text-[var(--danger)]'
            : pct >= 0.9
              ? 'text-[var(--warning)]'
              : 'text-[var(--success)]'
        }
      >
        {kb} / {(MAX_LINKED_BYTES / 1000).toFixed(1)} KB
      </span>
      {status}
    </p>
  );
}
