'use client';

// Ref: ARCHITECTURE.md §11 (SectionPreview: flex row of text + accessory).
// Text column + accessory (small Thumbnail or Button). Rendered from the tree.

import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDocumentStore } from '@/lib/store/document';
import { selectChildIds } from '@/lib/store/selectors';
import type { NodeId } from '@/lib/serializer/types';
import ButtonPreview from './ButtonPreview';
import PreviewNode from './PreviewNode';
import ThumbnailPreview from './ThumbnailPreview';

function SectionPreviewInner({ id }: { id: NodeId }) {
  const childIds = useDocumentStore(useShallow((s) => selectChildIds(s, id)));
  const accessory = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    if (n?.type !== 9 || n.accessoryId === undefined) return undefined;
    return s.doc.nodes[n.accessoryId];
  });

  return (
    <div className="flex items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {childIds.map((cid) => (
          <PreviewNode key={cid} id={cid} />
        ))}
      </div>
      {accessory?.type === 11 ? (
        <div className="shrink-0">
          <ThumbnailPreview id={accessory.id} size="sm" />
        </div>
      ) : accessory?.type === 2 ? (
        <div className="shrink-0">
          <ButtonPreview id={accessory.id} />
        </div>
      ) : null}
    </div>
  );
}

const SectionPreview = memo(SectionPreviewInner);
export default SectionPreview;
