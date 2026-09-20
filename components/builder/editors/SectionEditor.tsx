'use client';

// Ref: ARCHITECTURE.md §5.1 (Section: children 1-3 Text Display + 1 accessory).
// Section has no scalar fields. This editor is implicit via children:
// count info and hint only. No `any`.

import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

export default function SectionEditor({ id }: { id: NodeId }) {
  const textCount = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    if (n?.type !== 9) return 0;
    let count = 0;
    for (const cid of n.children) {
      if (s.doc.nodes[cid]?.type === 10) count += 1;
    }
    return count;
  });
  const hasAccessory = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 9 ? n.accessoryId !== undefined : false;
  });

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-[var(--text-primary)]" aria-live="polite">
        {textCount} of 3 text blocks{hasAccessory ? ', accessory attached' : ', no accessory'}.
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        Use 1 to 3 Text Displays plus one Button or Thumbnail as the accessory.
      </p>
    </div>
  );
}
