'use client';

// Ref: DESIGN.md §2 (canvas layout) + §8.1 (empty state) + §7 (role tree),
// ARCHITECTURE.md §6 (data flow) + §10 (store).
// Canvas renders the tree from the store via granular selectors. Autosave and
// undo/redo hooks are mounted here.
// Composition note: this file does NOT mount its own DndContext. The page
// wraps Palette + Canvas in ONE BuilderDndProvider so drag works across
// panels in a single context. Do not wrap Canvas again below the provider.

import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Box } from 'lucide-react';
import { useDocumentStore } from '@/lib/store/document';
import { TEMPLATES, templateSnapshot } from '@/lib/templates';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import type { ComponentType } from '@/lib/schema/constants';
import type { NodeId } from '@/lib/serializer/types';
import DropZone, { toComponentType } from './DropZone';
import NodeRenderer from './NodeRenderer';

/** Parse a `drop-root` or `drop-<parentId>` id into a parentId. */
function parseDropId(dropId: string): NodeId | null | undefined {
  if (dropId === 'drop-root') return null;
  if (dropId.startsWith('drop-')) return dropId.slice('drop-'.length);
  return undefined;
}

/**
 * Central drop handler (used by the provider below; exported so the page
 * can reuse it when the provider is lifted above Palette + Canvas).
 */
export function handleBuilderDragEnd(event: DragEndEvent): void {
  const { active, over } = event;
  if (over === null) return;
  const target = parseDropId(String(over.id));
  if (target === undefined) return;

  const current: unknown = active.data.current;
  if (typeof current !== 'object' || current === null) return;
  if (!('componentType' in current)) return;
  const childType: ComponentType | undefined = toComponentType(current.componentType);
  if (childType === undefined) return;

  const state = useDocumentStore.getState();
  try {
    if (!('kind' in current)) return;
    if (current.kind === 'palette') {
      const parentId = target === null ? null : target;
      if (childType === 17 && parentId !== null) return;
      if (childType === 17 && state.doc.rootId !== null) return;
      const created = state.addNode(parentId, childType);
      state.select(created);
    } else if (current.kind === 'node') {
      if (!('nodeId' in current) || typeof current.nodeId !== 'string') return;
      const nodeId: NodeId = current.nodeId;
      if (target === null) return;
      if (nodeId === target) return;
      state.moveNode(nodeId, target);
      state.select(nodeId);
    }
  } catch {
    // Invalid drop (full capacity, wrong parent): ignore, node stays put.
  }
}

export function BuilderDndProvider({ children }: { children: ReactNode }) {
  return <DndContext onDragEnd={handleBuilderDragEnd}>{children}</DndContext>;
}

function TemplatePicker() {
  const [open, setOpen] = useState(false);
  const importSnapshot = useDocumentStore((s) => s.importSnapshot);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="template-list"
        className="rounded-[var(--r-md)] bg-[var(--brand-blurple)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-blurple-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]"
      >
        Use template
      </button>
      {open ? (
        <div
          id="template-list"
          role="group"
          aria-label="Choose a template"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          className="flex w-full flex-col gap-1"
        >
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                importSnapshot(templateSnapshot(t.build()));
                setOpen(false);
              }}
              className="rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 text-left hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]"
            >
              <span className="block text-sm text-[var(--text-primary)]">{t.name}</span>
              <span className="block text-xs text-[var(--text-muted)]">{t.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-[var(--r-md)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
      >
        <Box size={20} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="text-sm text-[var(--text-primary)]">Start by dragging a Container here</p>
      <p className="max-w-60 text-xs text-[var(--text-muted)]">
        The Container is the single root. You can also click palette items to add.
      </p>
      <DropZone parentId={null} label="Drop the Container here" />
      <TemplatePicker />
    </div>
  );
}

function CanvasTree() {
  const rootId = useDocumentStore((s) => s.doc.rootId);
  const count = useDocumentStore((s) => Object.keys(s.doc.nodes).length);

  if (rootId === null) return <EmptyState />;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
        {count.toString()} components.
      </p>
      <NodeRenderer id={rootId} level={1} />
    </div>
  );
}

export default function Canvas() {
  useAutoSave();
  useUndoRedo();

  return (
    <section aria-label="Builder canvas" className="flex min-h-96 flex-col gap-3">
      <div role="tree" aria-label="Component tree" className="flex flex-col gap-2">
        <CanvasTree />
      </div>
    </section>
  );
}
