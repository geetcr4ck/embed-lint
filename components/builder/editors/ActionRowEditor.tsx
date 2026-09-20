'use client';

// Ref: ARCHITECTURE.md §5.1 (Action Row holds Buttons only).
// Action Row has no scalar fields. This editor is implicit via children:
// count info and hint only. No `any`.

import { useDocumentStore } from '@/lib/store/document';
import { ACTION_ROW_MAX_BUTTONS } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

export default function ActionRowEditor({ id }: { id: NodeId }) {
  const count = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 1 ? n.children.length : 0;
  });

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-[var(--text-primary)]" aria-live="polite">
        {count} of {ACTION_ROW_MAX_BUTTONS} buttons.
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        An Action Row holds buttons only. Add or remove them in the child list below.
      </p>
    </div>
  );
}
