'use client';

// Ref: ARCHITECTURE.md §5.1 (Separator: spacing 1|2, divider).
// Separator editor: spacing size and divider line.

import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';

export default function SeparatorEditor({ id }: { id: NodeId }) {
  const divider = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 14 ? (n.divider ?? true) : true;
  });
  const spacing = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 14 ? (n.spacing ?? 1) : 1;
  });
  const updateNode = useDocumentStore((s) => s.updateNode);

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="mb-1 text-xs font-semibold text-[var(--text-secondary)]">
          Spacing
        </legend>
        <div className="flex gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="radio"
              name={`${id}-spacing`}
              value="1"
              checked={spacing === 1}
              onChange={() => updateNode(id, { spacing: 1 })}
              className="h-4 w-4 accent-[var(--brand-blurple)]"
            />
            Small
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="radio"
              name={`${id}-spacing`}
              value="2"
              checked={spacing === 2}
              onChange={() => updateNode(id, { spacing: 2 })}
              className="h-4 w-4 accent-[var(--brand-blurple)]"
            />
            Large
          </label>
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
        <input
          type="checkbox"
          checked={divider}
          onChange={(e) => updateNode(id, { divider: e.target.checked })}
          className="h-4 w-4 accent-[var(--brand-blurple)]"
        />
        Show divider
      </label>
    </div>
  );
}
