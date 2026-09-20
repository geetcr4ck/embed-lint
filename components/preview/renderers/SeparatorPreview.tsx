'use client';

// Ref: ARCHITECTURE.md §11 (SeparatorPreview: divider line + spacing).

import { memo } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

function SeparatorPreviewInner({ id }: { id: NodeId }) {
  const node = useDocumentStore((s) => s.doc.nodes[id]);

  if (node?.type !== 14) return null;

  const spacing = node.spacing ?? 1;
  const divider = node.divider ?? true;

  return (
    <div role="separator" className={spacing === 2 ? 'py-3' : 'py-1'}>
      {divider ? <div className="h-px bg-[var(--border-subtle)]" /> : null}
    </div>
  );
}

const SeparatorPreview = memo(SeparatorPreviewInner);
export default SeparatorPreview;
