'use client';

// Ref: ARCHITECTURE.md §5.1 + LINK PREVIEW §17 (Button style 5, key whitelist).
// Button editor: url, label, emoji, disabled. Style locked to 5 (link).

import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

const inputCls =
  'w-full rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]';
const labelCls = 'mb-1 block text-xs font-semibold text-[var(--text-secondary)]';

export default function ButtonEditor({ id }: { id: NodeId }) {
  const url = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 2 ? n.url : '';
  });
  const label = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 2 ? (n.label ?? '') : '';
  });
  const emojiName = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 2 ? (n.emoji?.name ?? '') : '';
  });
  const disabled = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 2 ? (n.disabled ?? false) : false;
  });
  const updateNode = useDocumentStore((s) => s.updateNode);

  const urlEmpty = url.trim() === '';

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-[var(--r-sm)] bg-[var(--bg-input)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
        style locked: 5 (link)
      </p>
      <div>
        <label htmlFor={`${id}-url`} className={labelCls}>
          URL
        </label>
        <input
          id={`${id}-url`}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://example.com/page"
          value={url}
          onChange={(e) => updateNode(id, { url: e.target.value })}
          className={inputCls}
        />
        {urlEmpty ? (
          <p className="mt-1 text-xs text-[var(--warning)]">Add the button target URL.</p>
        ) : null}
      </div>
      <div>
        <label htmlFor={`${id}-label`} className={labelCls}>
          Label
        </label>
        <input
          id={`${id}-label`}
          type="text"
          autoComplete="off"
          placeholder="Visit website"
          value={label}
          onChange={(e) => updateNode(id, { label: e.target.value })}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">Add a label or an emoji.</p>
      </div>
      <div>
        <label htmlFor={`${id}-emoji`} className={labelCls}>
          Emoji
        </label>
        <input
          id={`${id}-emoji`}
          type="text"
          autoComplete="off"
          placeholder="🎉 or :party:"
          value={emojiName}
          onChange={(e) => updateNode(id, { emoji: { name: e.target.value } })}
          className={inputCls}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
        <input
          type="checkbox"
          checked={disabled}
          onChange={(e) => updateNode(id, { disabled: e.target.checked })}
          className="h-4 w-4 accent-[var(--brand-blurple)]"
        />
        Disabled
      </label>
    </div>
  );
}
