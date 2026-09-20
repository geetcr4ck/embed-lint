'use client';

// Ref: ARCHITECTURE.md §11 (ThumbnailPreview: aspect-square, rounded).
// No URL: honest placeholder. Never fetch URLs for validation (privacy).

import { memo } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

interface ThumbnailPreviewProps {
  id: NodeId;
  size?: 'sm' | 'md';
}

function ThumbnailPreviewInner({ id, size = 'md' }: ThumbnailPreviewProps) {
  const node = useDocumentStore((s) => s.doc.nodes[id]);

  if (node?.type !== 11) return null;

  const box = size === 'sm' ? 'h-20 w-20' : 'h-40 w-40';

  if (node.url.trim() === '') {
    return (
      <div
        aria-label="Thumbnail has no image yet"
        className={`flex ${box} items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] p-1 text-center text-xs text-[var(--text-muted)]`}
      >
        No image yet
      </div>
    );
  }
  return (
    // User-owned URLs (arbitrary domains) do not fit next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={node.url}
      alt="Thumbnail"
      loading="lazy"
      className={`${box} rounded-lg object-cover`}
    />
  );
}

const ThumbnailPreview = memo(ThumbnailPreviewInner);
export default ThumbnailPreview;
