'use client';

// Ref: DESIGN.md §4.4 (textarea auto-grow + toolbar B I S link code).
// Text Display editor: raw markdown, controlled, no react-hook-form.

import { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

const toolbarBtn =
  'rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1 font-mono text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]';

export default function TextDisplayEditor({ id }: { id: NodeId }) {
  const content = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 10 ? n.content : '';
  });
  const updateNode = useDocumentStore((s) => s.updateNode);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow: height follows content.
  useEffect(() => {
    const el = areaRef.current;
    if (el === null) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const applyWrap = (before: string, after?: string): void => {
    const el = areaRef.current;
    if (el === null) {
      updateNode(id, { content: `${before}${content}${after ?? before}` });
      return;
    }
    const { selectionStart, selectionEnd, value } = el;
    const close = after ?? before;
    const next = `${value.slice(0, selectionStart)}${before}${value.slice(selectionStart, selectionEnd)}${close}${value.slice(selectionEnd)}`;
    updateNode(id, { content: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart + before.length, selectionEnd + before.length);
    });
  };

  const applyLink = (): void => {
    const el = areaRef.current;
    if (el === null) {
      updateNode(id, { content: `${content}[text](https://)` });
      return;
    }
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd) || 'text';
    const next = `${value.slice(0, selectionStart)}[${selected}](https://)${value.slice(selectionEnd)}`;
    updateNode(id, { content: next });
    requestAnimationFrame(() => {
      el.focus();
      const caret = selectionStart + selected.length + 3;
      el.setSelectionRange(caret, caret + 8);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Markdown formatting" className="flex flex-wrap gap-1">
        <button type="button" aria-label="Bold" onClick={() => applyWrap('**')} className={toolbarBtn}>
          <strong>B</strong>
        </button>
        <button type="button" aria-label="Italic" onClick={() => applyWrap('*')} className={toolbarBtn}>
          <em>I</em>
        </button>
        <button
          type="button"
          aria-label="Strikethrough"
          onClick={() => applyWrap('~~')}
          className={toolbarBtn}
        >
          <s>S</s>
        </button>
        <button type="button" aria-label="Link" onClick={applyLink} className={toolbarBtn}>
          link
        </button>
        <button type="button" aria-label="Code" onClick={() => applyWrap('`')} className={toolbarBtn}>
          {'</>'}
        </button>
      </div>
      <label htmlFor={`${id}-content`} className="sr-only">
        Markdown text
      </label>
      <textarea
        id={`${id}-content`}
        ref={areaRef}
        rows={2}
        value={content}
        onChange={(e) => updateNode(id, { content: e.target.value })}
        placeholder="Write markdown here"
        className="w-full resize-none overflow-hidden rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blurple)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blurple)]"
      />
      <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
        {content.length} characters.
      </p>
    </div>
  );
}
