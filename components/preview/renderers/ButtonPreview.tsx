'use client';

// Ref: ARCHITECTURE.md §11 (ButtonPreview: secondary link style).
// Disabled buttons or ones without a URL render as a span (no fake link).

import { memo } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

function ButtonPreviewInner({ id }: { id: NodeId }) {
  const node = useDocumentStore((s) => s.doc.nodes[id]);

  if (node?.type !== 2) return null;
  const label = node.label ?? node.emoji?.name ?? 'Link';
  const text = node.emoji?.name ? `${node.emoji.name} ${label}`.trim() : label;
  const clickable = !node.disabled && node.url.trim() !== '';

  const cls = [
    'inline-flex items-center justify-center rounded border border-[var(--border-subtle)]',
    'bg-[var(--bg-surface)] px-4 py-1.5 text-sm text-[var(--text-primary)]',
    clickable ? 'hover:bg-[var(--bg-input)]' : 'cursor-not-allowed opacity-50',
  ].join(' ');

  if (!clickable) {
    return (
      <span className={cls} aria-disabled="true">
        {text}
      </span>
    );
  }
  return (
    <a href={node.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {text}
    </a>
  );
}

const ButtonPreview = memo(ButtonPreviewInner);
export default ButtonPreview;
