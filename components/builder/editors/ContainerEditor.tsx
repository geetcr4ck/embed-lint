'use client';

// Ref: DESIGN.md §4.4 (accent color picker + hex), ARCHITECTURE.md §5.1.
// Container editor: accent color (hex + picker, realtime conversion to integer)
// and spoiler. No `any`, no react-hook-form.

import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';
import { hexToInt, intToHex } from '@/lib/utils/hex';

const inputCls =
  'w-full rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]';
const labelCls = 'mb-1 block text-xs font-semibold text-[var(--text-secondary)]';

export default function ContainerEditor({ id }: { id: NodeId }) {
  const accentColor = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 17 ? (n.accentColor ?? null) : null;
  });
  const spoiler = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 17 ? (n.spoiler ?? false) : false;
  });
  const updateNode = useDocumentStore((s) => s.updateNode);

  const initialHex = accentColor === null ? '' : intToHex(accentColor);
  const [draft, setDraft] = useState(initialHex);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(accentColor === null ? '' : intToHex(accentColor));
    setError(null);
  }, [accentColor]);

  const commitHex = (value: string): void => {
    setDraft(value);
    const trimmed = value.trim();
    if (trimmed === '') {
      setError(null);
      return;
    }
    try {
      const next = hexToInt(trimmed);
      setError(null);
      updateNode(id, { accentColor: next });
    } catch {
      setError('Invalid hex. Use 6 digits, e.g. #5865F2.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={`${id}-accent`} className={labelCls}>
          Accent color
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`${id}-accent-picker`}
            type="color"
            aria-label="Pick an accent color"
            value={accentColor === null ? '#5865f2' : intToHex(accentColor)}
            onChange={(e) => commitHex(e.target.value)}
            className="h-8 w-10 shrink-0 cursor-pointer rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)]"
          />
          <input
            id={`${id}-accent`}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="#5865F2"
            value={draft}
            onChange={(e) => commitHex(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
        {error !== null ? (
          <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
            {error}
          </p>
        ) : (
          <p className="mt-1 text-xs text-[var(--text-muted)]" aria-live="polite">
            {accentColor === null ? 'No color set.' : `Integer: ${accentColor}.`}
          </p>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
        <input
          type="checkbox"
          checked={spoiler}
          onChange={(e) => updateNode(id, { spoiler: e.target.checked })}
          className="h-4 w-4 accent-[var(--brand-blurple)]"
        />
        Spoiler
      </label>
    </div>
  );
}
