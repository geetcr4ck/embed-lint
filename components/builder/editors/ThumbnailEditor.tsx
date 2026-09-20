'use client';

// Ref: DESIGN.md §4.4 (media input + live validation icon on the right), ARCHITECTURE.md §18.
// Thumbnail editor: url + live validation. Canonical: url only (no description).

import { MAX_URL_LENGTH, THUMBNAIL_FORMATS } from '@/lib/schema/constants';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

const inputCls =
  'w-full rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 pr-8 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]';

function extOf(url: string): string {
  const clean = url.split('?')[0]?.split('#')[0] ?? '';
  const last = clean.split('/').pop() ?? '';
  const dot = last.lastIndexOf('.');
  return dot < 0 ? '' : last.slice(dot + 1).toLowerCase();
}

export default function ThumbnailEditor({ id }: { id: NodeId }) {
  const url = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 11 ? n.url : '';
  });
  const updateNode = useDocumentStore((s) => s.updateNode);

  const trimmed = url.trim();
  const tooLong = trimmed.length > MAX_URL_LENGTH;
  const ext = extOf(trimmed);
  const badFormat =
    trimmed !== '' && ext !== '' && !(THUMBNAIL_FORMATS as readonly string[]).includes(ext);
  const badProto = trimmed !== '' && !/^https?:\/\//i.test(trimmed);
  const ok = trimmed !== '' && !tooLong && !badFormat && !badProto;

  return (
    <div>
      <label
        htmlFor={`${id}-url`}
        className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
      >
        Image URL
      </label>
      <div className="relative">
        <input
          id={`${id}-url`}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://example.com/image.png"
          value={url}
          onChange={(e) => updateNode(id, { url: e.target.value })}
          aria-invalid={tooLong || badFormat || badProto}
          aria-describedby={`${id}-url-hint`}
          className={inputCls}
        />
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm',
            ok ? 'text-[var(--success)]' : 'text-[var(--text-muted)]',
          ].join(' ')}
        >
          {ok ? '✓' : trimmed === '' ? '' : '✗'}
        </span>
      </div>
      <div id={`${id}-url-hint`}>
        {trimmed === '' ? (
          <p className="mt-1 text-xs text-[var(--text-muted)]">Paste an image URL (png, gif, webp).</p>
        ) : tooLong ? (
          <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
            URL exceeds {MAX_URL_LENGTH} characters.
          </p>
        ) : badProto ? (
          <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
            URL must start with http or https.
          </p>
        ) : badFormat ? (
          <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
            Unknown format. Use png, gif, jpeg, webp, or avif.
          </p>
        ) : (
          <p className="mt-1 text-xs text-[var(--success)]">URL looks valid.</p>
        )}
      </div>
    </div>
  );
}
