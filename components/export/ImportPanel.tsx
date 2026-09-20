'use client';

// Two-step JSON import: write or pick a file, validate, then a
// confirmation summary before the document is replaced. Honest errors on failure.

import { useState } from 'react';
import { ClipboardPaste, Upload } from 'lucide-react';
import { fromJson } from '@/lib/serializer/fromJson';
import type { Tree } from '@/lib/serializer/types';
import { useDocumentStore } from '@/lib/store/document';

const inputCls =
  'w-full rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]';
const btnCls =
  'flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]';

export default function ImportPanel() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Tree | null>(null);
  const importSnapshot = useDocumentStore((s) => s.importSnapshot);

  const prepareImport = (raw: string): void => {
    if (raw.trim() === '') {
      setError('Paste JSON first.');
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError('That text is not valid JSON.');
      return;
    }
    try {
      setPending(fromJson(parsed));
      setError(null);
    } catch {
      setError('Not a valid Discord payload. Make sure the root is { component: { type: 17 } }.');
    }
  };

  const confirmImport = (): void => {
    if (pending === null) return;
    importSnapshot(JSON.stringify({ version: 1, nodes: pending.nodes, rootId: pending.rootId }));
    setText('');
    setError(null);
    setPending(null);
    setOpen(false);
  };

  const onFile = (file: File | undefined): void => {
    if (file === undefined) return;
    void file
      .text()
      .then((content) => setText(content))
      .catch(() => setError('Could not read the file.'));
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 self-start rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]"
      >
        <ClipboardPaste size={16} strokeWidth={1.5} aria-hidden="true" />
        Import JSON
      </button>
      {open ? (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (pending !== null) setPending(null);
              else setOpen(false);
            }
          }}
          className="flex flex-col gap-2 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2"
        >
          {pending === null ? (
            <>
              <p className="text-xs text-[var(--text-muted)]">
                Importing replaces the current document.
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Paste the JSON payload
                </span>
                <textarea
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='{ "component": { "type": 17 } }'
                  spellCheck={false}
                  className={`${inputCls} font-mono`}
                />
              </label>
              <label className={btnCls}>
                <Upload size={16} strokeWidth={1.5} aria-hidden="true" />
                Choose a .json file
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => onFile(e.target.files?.[0])}
                  className="sr-only"
                />
              </label>
              {error !== null ? (
                <p role="alert" className="text-xs text-[var(--danger)]">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => prepareImport(text)}
                  className="rounded-[var(--r-sm)] bg-[var(--brand-blurple)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-blurple-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]"
                >
                  Continue
                </button>
                <button type="button" onClick={() => setOpen(false)} className={btnCls}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--text-primary)]" aria-live="polite">
                Ready to replace the document with {Object.keys(pending.nodes).length.toString()} components.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Undo history is cleared and cannot be restored.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={confirmImport}
                  className="rounded-[var(--r-sm)] bg-[var(--brand-blurple)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-blurple-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]"
                >
                  Confirm import
                </button>
                <button type="button" onClick={() => setPending(null)} className={btnCls}>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
