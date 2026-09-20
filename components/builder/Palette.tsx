'use client';

// Ref: DESIGN.md §4.1 (Palette Item) + §6 (iconography).
// 8 drag sources. Click or Enter also adds to the root Container
// as a keyboard fallback when drag is unavailable.

import { useDraggable } from '@dnd-kit/core';
import {
  Box,
  Columns2,
  Image,
  Images,
  Minus,
  MousePointerClick,
  Rows,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentType } from '@/lib/schema/constants';
import { useDocumentStore } from '@/lib/store/document';

interface PaletteDef {
  type: ComponentType;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: PaletteDef[] = [
  { type: 17, label: 'Container', Icon: Box },
  { type: 9, label: 'Section', Icon: Columns2 },
  { type: 10, label: 'Text Display', Icon: Type },
  { type: 2, label: 'Button', Icon: MousePointerClick },
  { type: 11, label: 'Thumbnail', Icon: Image },
  { type: 12, label: 'Media Gallery', Icon: Images },
  { type: 14, label: 'Separator', Icon: Minus },
  { type: 1, label: 'Action Row', Icon: Rows },
];

function PaletteItem({ def }: { def: PaletteDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${def.type}`,
    data: { kind: 'palette', componentType: def.type },
  });

  const addToRoot = (): void => {
    const state = useDocumentStore.getState();
    try {
      if (def.type === 17) {
        if (state.doc.rootId !== null) return;
        const id = state.addNode(null, 17);
        state.select(id);
        return;
      }
      const rootId = state.doc.rootId;
      if (rootId === null) return;
      const id = state.addNode(rootId, def.type);
      state.select(id);
    } catch {
      // Invalid parent (e.g. Section needs a special host): ignore silently.
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Add ${def.label} (type ${def.type})`}
      onClick={addToRoot}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addToRoot();
        }
      }}
      className={[
        'flex cursor-grab items-center gap-3 rounded-[var(--r-md)] border border-[var(--border-subtle)]',
        'bg-[var(--bg-surface)] px-3 py-2 transition-colors motion-reduce:transition-none',
        'hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]',
        isDragging ? 'border-[var(--brand-blurple)] opacity-60' : '',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--bg-input)] text-[var(--text-primary)]"
      >
        <def.Icon size={16} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-[var(--text-primary)]">{def.label}</span>
        <span className="block font-mono text-xs text-[var(--text-muted)]">
          type {def.type}
        </span>
      </span>
    </div>
  );
}

export default function Palette() {
  return (
    <section aria-label="Component palette" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Components
      </h2>
      {ITEMS.map((def) => (
        <PaletteItem key={def.type} def={def} />
      ))}
      <p className="text-xs text-[var(--text-muted)]">Drag onto the canvas or click to add.</p>
    </section>
  );
}
