'use client';

// Ref: ARCHITECTURE.md §9 (inline/linked export), DESIGN.md §9 (microcopy).
// Inline/Linked tabs. Linked: hard warning + copy disabled when over limit.

import { useRef, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { toInlineSnippet } from '@/lib/exporters/inline';
import { isOverLinkedLimit, toLinkedJsonFile, toLinkedSnippet } from '@/lib/exporters/linked';
import { MAX_LINKED_BYTES } from '@/lib/schema/constants';
import { useInspectedPayload } from '../inspector/usePayload';

type ExportTab = 'inline' | 'linked';

const TABS: { id: ExportTab; label: string }[] = [
  { id: 'inline', label: 'Inline' },
  { id: 'linked', label: 'Linked' },
];

const copyBtn =
  'flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)] disabled:cursor-not-allowed disabled:opacity-40';

function useCopy(): { copied: string | null; copy: (key: string, text: string) => void; error: string | null } {
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = (key: string, text: string): void => {
    if (text === '') return;
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(key);
        setError(null);
      })
      .catch(() => {
        setCopied(null);
        setError('Could not copy to clipboard.');
      });
  };
  return { copied, copy, error };
}

export default function ExportPanel() {
  const { payload, result } = useInspectedPayload();
  const [tab, setTab] = useState<ExportTab>('inline');
  const [url, setUrl] = useState('');
  const { copied, copy, error: copyError } = useCopy();
  const inlineRef = useRef<HTMLButtonElement | null>(null);
  const linkedRef = useRef<HTMLButtonElement | null>(null);

  const bytes = result?.stats.rawBytes ?? 0;
  const pct = bytes / MAX_LINKED_BYTES;
  const over = payload !== null && isOverLinkedLimit(payload);
  const inlineSnippet = payload === null ? '' : toInlineSnippet(payload);
  const linkedSnippet = toLinkedSnippet(url.trim());

  const focusTab = (next: ExportTab): void => {
    setTab(next);
    (next === 'inline' ? inlineRef : linkedRef).current?.focus();
  };

  const downloadJson = (): void => {
    if (payload === null) return;
    const href = URL.createObjectURL(toLinkedJsonFile(payload));
    const a = document.createElement('a');
    a.href = href;
    a.download = 'embed.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Export
      </h2>
      {payload === null ? (
        <p className="text-sm text-[var(--text-muted)]">No payload to export yet.</p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Export mode"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                focusTab('linked');
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                focusTab('inline');
              }
            }}
            className="flex gap-1"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={t.id === 'inline' ? inlineRef : linkedRef}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'rounded-[var(--r-sm)] px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]',
                  tab === t.id
                    ? 'bg-[var(--brand-blurple)] text-white'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p aria-live="polite" className="sr-only">
            {copied !== null ? 'Snippet copied.' : (copyError ?? '')}
          </p>

          {tab === 'inline' ? (
            <div role="tabpanel" aria-label="Export inline" className="flex flex-col gap-2">
              <pre className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2 font-mono text-xs text-[var(--text-primary)]">
                {inlineSnippet}
              </pre>
              <div>
                <button type="button" onClick={() => copy('inline', inlineSnippet)} className={copyBtn}>
                  {copied === 'inline' ? (
                    <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                  )}
                  {copied === 'inline' ? 'Copied' : 'Copy snippet'}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Paste it inside the {'<head>'} of your page.
              </p>
            </div>
          ) : (
            <div role="tabpanel" aria-label="Export linked" className="flex flex-col gap-2">
              <p
                aria-live="polite"
                className={[
                  'text-xs',
                  over
                    ? 'text-[var(--danger)]'
                    : pct >= 0.9
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--success)]',
                ].join(' ')}
              >
                {bytes.toString()} / {MAX_LINKED_BYTES.toString()} bytes
                {over ? ' over the limit.' : '.'}
              </p>
              {over ? (
                <p role="alert" className="rounded-[var(--r-md)] border border-[var(--danger)] bg-[var(--bg-input)] p-2 text-xs text-[var(--danger)]">
                  Payload exceeds 3,000 bytes. Trim content before using linked mode.
                </p>
              ) : null}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Target JSON file URL
                </span>
                <input
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="https://your-site.com/embed.json"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]"
                />
              </label>
              <pre className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2 font-mono text-xs text-[var(--text-primary)]">
                {linkedSnippet}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy('linked', linkedSnippet)}
                  disabled={over || url.trim() === ''}
                  className={copyBtn}
                >
                  {copied === 'linked' ? (
                    <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                  )}
                  {copied === 'linked' ? 'Copied' : 'Copy snippet'}
                </button>
                <button type="button" onClick={downloadJson} className={copyBtn}>
                  <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                  Download JSON
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Upload the JSON to your server, then paste this {'<link>'}.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Discord caches previews for about 30 minutes. Add ?v=2 to refresh.
              </p>
            </div>
          )}
          {copyError !== null ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {copyError}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
