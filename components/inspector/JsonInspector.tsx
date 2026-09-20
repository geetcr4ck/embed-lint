'use client';

// Ref: DESIGN.md §8.2 (Monaco loading: shimmer skeleton, no spinner).
// Read-only JSON payload from the tree. Per-path markers skipped (costly);
// a concise banner instead when errors exist.

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useInspectedPayload } from './usePayload';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-80 animate-pulse rounded-[var(--r-md)] bg-[var(--bg-elevated)]"
    />
  ),
});

export default function JsonInspector() {
  const { hasRoot, pretty, result } = useInspectedPayload();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const errorCount = result?.issues.filter((issue) => issue.severity === 'error').length ?? 0;

  const copyJson = async (): Promise<void> => {
    if (pretty === '') return;
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopied(false);
      setCopyError('Could not copy to clipboard.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          JSON
        </h2>
        <button
          type="button"
          onClick={() => void copyJson()}
          disabled={pretty === ''}
          className="flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? (
            <Check size={16} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? 'JSON copied.' : (copyError ?? '')}
      </p>
      {copyError !== null ? (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {copyError}
        </p>
      ) : null}
      {!hasRoot || pretty === '' ? (
        <p className="rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-muted)]">
          No JSON yet. Add a Container on the canvas.
        </p>
      ) : (
        <>
          {errorCount > 0 ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {errorCount.toString()} errors. Fix them in the error panel before exporting.
            </p>
          ) : null}
          <div
            className={[
              'overflow-hidden rounded-[var(--r-md)] border',
              errorCount > 0 ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]',
            ].join(' ')}
          >
            <MonacoEditor
              height="320px"
              language="json"
              theme="vs-dark"
              value={pretty}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
