'use client';

// Ref: ARCHITECTURE.md §11 (TextDisplayPreview: markdown-it then sanitize),
// AGENTS.md §11 (dangerouslySetInnerHTML only together with DOMPurify).
// Discord-ish markdown: linkify, newlines become line breaks, spoiler ||text||.
// Sanitize + render client-side only (effect after mount) to keep prerender safe.

import { memo, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

let md: InstanceType<typeof MarkdownIt> | null = null;

function getMd(): InstanceType<typeof MarkdownIt> {
  if (md !== null) return md;
  const instance = new MarkdownIt({ html: false, linkify: true, breaks: true });
  // Inline spoiler rule ||text|| before emphasis.
  instance.inline.ruler.before('emphasis', 'spoiler', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;
    if (state.src.charCodeAt(start) !== 0x7c) return false;
    if (start + 1 >= max || state.src.charCodeAt(start + 1) !== 0x7c) return false;
    let end = start + 2;
    let found = false;
    while (end + 1 < max) {
      if (state.src.charCodeAt(end) === 0x7c && state.src.charCodeAt(end + 1) === 0x7c) {
        found = true;
        break;
      }
      end += 1;
    }
    if (!found || end === start + 2) return false;
    if (silent) return true;
    const open = state.push('spoiler_open', 'span', 1);
    open.attrs = [
      ['class', 'discord-spoiler'],
      ['data-spoiler', 'true'],
      ['tabindex', '0'],
      ['role', 'button'],
    ];
    const text = state.push('text', '', 0);
    text.content = state.src.slice(start + 2, end);
    state.push('spoiler_close', 'span', -1);
    state.pos = end + 2;
    return true;
  });
  md = instance;
  return instance;
}

if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

function toggleSpoilerTarget(target: EventTarget | null): void {
  if (!(target instanceof HTMLElement)) return;
  const el = target.closest('[data-spoiler]');
  if (el === null || !(el instanceof HTMLElement)) return;
  if (el.dataset.revealed === 'true') {
    delete el.dataset.revealed;
  } else {
    el.dataset.revealed = 'true';
  }
}

function hideSpoilerTarget(target: EventTarget | null): void {
  if (!(target instanceof HTMLElement)) return;
  const el = target.closest('[data-spoiler]');
  if (el !== null && el instanceof HTMLElement) delete el.dataset.revealed;
}

function TextDisplayPreviewInner({ id }: { id: NodeId }) {
  const content = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 10 ? n.content : '';
  });
  const [html, setHtml] = useState('');

  useEffect(() => {
    setHtml(DOMPurify.sanitize(getMd().render(content), { ADD_ATTR: ['tabindex'] }));
  }, [content]);

  if (content === '') return null;

  return (
    <div
      className="discord-md text-base text-[var(--text-primary)]"
      onClick={(e) => toggleSpoilerTarget(e.target)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSpoilerTarget(e.target);
        } else if (e.key === 'Escape') {
          hideSpoilerTarget(e.target);
        }
      }}
      // Safe: html already passed DOMPurify.sanitize.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const TextDisplayPreview = memo(TextDisplayPreviewInner);
export default TextDisplayPreview;
