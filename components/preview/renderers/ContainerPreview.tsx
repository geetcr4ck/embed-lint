'use client';

// Ref: ARCHITECTURE.md §11 (ContainerPreview: left accent border, 8px radius).
// Rendered from the tree via granular selectors. The integer accent color is
// converted to hex (inline style only for this dynamic value).

import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDocumentStore } from '@/lib/store/document';
import { selectChildIds } from '@/lib/store/selectors';
import type { NodeId } from '@/lib/serializer/types';
import { intToHex } from '@/lib/utils/hex';
import PreviewNode from './PreviewNode';
import Spoiler from './Spoiler';

function ContainerPreviewInner({ id }: { id: NodeId }) {
  const accentColor = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 17 ? (n.accentColor ?? null) : null;
  });
  const spoiler = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 17 ? (n.spoiler ?? false) : false;
  });
  const childIds = useDocumentStore(useShallow((s) => selectChildIds(s, id)));

  const accentHex = accentColor === null ? null : intToHex(accentColor);
  const body = (
    <>
      {childIds.map((cid) => (
        <PreviewNode key={cid} id={cid} />
      ))}
    </>
  );

  return (
    <div className="overflow-hidden rounded-lg bg-[var(--bg-elevated)]">
      <div className="flex">
        {accentHex === null ? null : (
          <div aria-hidden="true" style={{ backgroundColor: accentHex }} className="w-1 shrink-0" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
          {spoiler ? <Spoiler label="Reveal container spoiler">{body}</Spoiler> : body}
        </div>
      </div>
    </div>
  );
}

const ContainerPreview = memo(ContainerPreviewInner);
export default ContainerPreview;
