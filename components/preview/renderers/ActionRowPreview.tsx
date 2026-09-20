'use client';

// Ref: ARCHITECTURE.md §11 (ActionRowPreview: flex row).

import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDocumentStore } from '@/lib/store/document';
import { selectChildIds } from '@/lib/store/selectors';
import type { NodeId } from '@/lib/serializer/types';
import ButtonPreview from './ButtonPreview';

function ActionRowPreviewInner({ id }: { id: NodeId }) {
  const childIds = useDocumentStore(useShallow((s) => selectChildIds(s, id)));

  return (
    <div className="flex flex-row flex-wrap gap-2">
      {childIds.map((cid) => (
        <ButtonPreview key={cid} id={cid} />
      ))}
    </div>
  );
}

const ActionRowPreview = memo(ActionRowPreviewInner);
export default ActionRowPreview;
