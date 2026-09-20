'use client';

// Ref: ARCHITECTURE.md §11 (MediaGalleryPreview: 2-column grid).
// Each item: image + optional caption, wrapped in a Spoiler when flagged.

import { memo } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';
import Spoiler from './Spoiler';

function MediaGalleryPreviewInner({ id }: { id: NodeId }) {
  const node = useDocumentStore((s) => s.doc.nodes[id]);

  if (node?.type !== 12) return null;

  if (node.items.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No media yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {node.items.map((item, index) => {
        const body = (
          <figure className="m-0 flex min-w-0 flex-col gap-1">
            {item.url.trim() === '' ? (
              <div
                aria-label={`Media ${(index + 1).toString()} has no image yet`}
                className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] p-1 text-center text-xs text-[var(--text-muted)]"
              >
                No image yet
              </div>
            ) : (
              // User-owned URLs (arbitrary domains) do not fit next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.description ?? `Media ${(index + 1).toString()}`}
                loading="lazy"
                className="aspect-video w-full rounded-lg object-cover"
              />
            )}
            {item.description ? (
              <figcaption className="truncate text-xs text-[var(--text-muted)]">
                {item.description}
              </figcaption>
            ) : null}
          </figure>
        );
        return (
          <div key={`${id}-media-${index.toString()}`}>
            {item.spoiler ? (
              <Spoiler label={`Reveal media ${(index + 1).toString()} spoiler`}>{body}</Spoiler>
            ) : (
              body
            )}
          </div>
        );
      })}
    </div>
  );
}

const MediaGalleryPreview = memo(MediaGalleryPreviewInner);
export default MediaGalleryPreview;
