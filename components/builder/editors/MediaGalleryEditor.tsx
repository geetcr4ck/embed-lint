'use client';

// Ref: ARCHITECTURE.md §5.1 + §18 (gallery item: url + optional description/spoiler).
// Media Gallery editor: item list with per-item add and remove.

import { useDocumentStore } from '@/lib/store/document';
import type { MediaGalleryItem, NodeId } from '@/lib/serializer/types';

const inputCls =
  'w-full rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]';
const smallBtn =
  'rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]';

export default function MediaGalleryEditor({ id }: { id: NodeId }) {
  const items = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 12 ? n.items : [];
  });
  const updateNode = useDocumentStore((s) => s.updateNode);

  const patchItem = (index: number, patch: Partial<MediaGalleryItem>): void => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    updateNode(id, { items: next });
  };

  const removeItem = (index: number): void => {
    updateNode(id, { items: items.filter((_, i) => i !== index) });
  };

  const addItem = (): void => {
    updateNode(id, { items: [...items, { url: '' }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
        {items.length} media items.
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No media yet. Add one below.</p>
      ) : null}
      <ol className="flex list-none flex-col gap-3 p-0">
        {items.map((item, index) => (
          <li
            key={`${id}-item-${index.toString()}`}
            className="flex flex-col gap-2 rounded-[var(--r-md)] border border-[var(--border-subtle)] p-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Media {(index + 1).toString()}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Remove media ${(index + 1).toString()}`}
                className={smallBtn}
              >
                Remove
              </button>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-secondary)]">URL</span>
              <input
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://example.com/photo.png"
                value={item.url}
                onChange={(e) => patchItem(index, { url: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-secondary)]">Description (optional)</span>
              <input
                type="text"
                autoComplete="off"
                placeholder="Image caption"
                value={item.description ?? ''}
                onChange={(e) => patchItem(index, { description: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={item.spoiler ?? false}
                onChange={(e) => patchItem(index, { spoiler: e.target.checked })}
                className="h-4 w-4 accent-[var(--brand-blurple)]"
              />
              Spoiler
            </label>
          </li>
        ))}
      </ol>
      <button type="button" onClick={addItem} className={smallBtn}>
        Add media
      </button>
    </div>
  );
}
