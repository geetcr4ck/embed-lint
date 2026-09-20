'use client';

// Ref: DESIGN.md §4.2 (Canvas Node) + §7 (ARIA tree), ARCHITECTURE.md §5.1 + §15.
// One component per type via discriminated union. Granular selectors + memo
// so editing one node never re-renders the whole canvas.

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useDocumentStore } from '@/lib/store/document';
import { selectChildIds } from '@/lib/store/selectors';
import type { BuilderNode, NodeId } from '@/lib/serializer/types';
import DropZone from './DropZone';
import ActionRowEditor from './editors/ActionRowEditor';
import ButtonEditor from './editors/ButtonEditor';
import ContainerEditor from './editors/ContainerEditor';
import MediaGalleryEditor from './editors/MediaGalleryEditor';
import SectionEditor from './editors/SectionEditor';
import SeparatorEditor from './editors/SeparatorEditor';
import TextDisplayEditor from './editors/TextDisplayEditor';
import ThumbnailEditor from './editors/ThumbnailEditor';

const TYPE_LABEL: Record<BuilderNode['type'], string> = {
  17: 'Container',
  9: 'Section',
  10: 'Text Display',
  2: 'Button',
  11: 'Thumbnail',
  12: 'Media Gallery',
  14: 'Separator',
  1: 'Action Row',
};

/** One-line summary per type for the node header. */
function summaryOf(node: BuilderNode): string {
  switch (node.type) {
    case 17:
      return node.accentColor === undefined ? 'no accent' : 'accent set';
    case 9:
      return 'text + accessory';
    case 10:
      return node.content === '' ? 'empty text' : node.content.slice(0, 48);
    case 2:
      return node.label ?? node.url;
    case 11:
      return node.url === '' ? 'empty URL' : node.url.slice(0, 48);
    case 12:
      return `${node.items.length.toString()} media`;
    case 14:
      return node.divider === false ? 'spacer only' : 'divider';
    case 1:
      return `${node.children.length.toString()} button`;
  }
}

function EditorFor({ node }: { node: BuilderNode }) {
  switch (node.type) {
    case 17:
      return <ContainerEditor id={node.id} />;
    case 9:
      return <SectionEditor id={node.id} />;
    case 10:
      return <TextDisplayEditor id={node.id} />;
    case 2:
      return <ButtonEditor id={node.id} />;
    case 11:
      return <ThumbnailEditor id={node.id} />;
    case 12:
      return <MediaGalleryEditor id={node.id} />;
    case 14:
      return <SeparatorEditor id={node.id} />;
    case 1:
      return <ActionRowEditor id={node.id} />;
  }
}

interface NodeRendererProps {
  id: NodeId;
  level: number;
}

function NodeRendererInner({ id, level }: NodeRendererProps) {
  const node = useDocumentStore((s) => s.doc.nodes[id]);
  const isSelected = useDocumentStore((s) => s.doc.selectedId === id);
  const childIds = useDocumentStore(useShallow((s) => selectChildIds(s, id)));
  const accessoryId = useDocumentStore((s) => {
    const n = s.doc.nodes[id];
    return n?.type === 9 ? (n.accessoryId ?? null) : null;
  });
  const select = useDocumentStore((s) => s.select);
  const removeNode = useDocumentStore((s) => s.removeNode);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `node-${id}`,
    data: { kind: 'node', nodeId: id, componentType: node?.type },
  });

  if (node === undefined) return null;

  const hasChildren = node.type === 17 || node.type === 9 || node.type === 1;
  const isContainer = node.type === 17;
  // Inline styles only for dynamic values (drag position). Tokens via CSS vars.
  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      id={`builder-node-${id}`}
      role="treeitem"
      aria-level={level}
      aria-selected={isSelected}
      aria-label={`${TYPE_LABEL[node.type]}: ${summaryOf(node)}`}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        select(id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          select(id);
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          select(null);
          if (e.target instanceof HTMLElement) e.target.blur();
        }
      }}
      className={[
        'group rounded-[var(--r-md)] bg-[var(--bg-surface)] transition-shadow motion-reduce:transition-none',
        isSelected
          ? 'border-2 border-[var(--brand-blurple)] shadow-[var(--shadow-focus)]'
          : 'border border-[var(--border-subtle)]',
        isDragging ? 'opacity-60' : '',
      ].join(' ')}
      style={dragStyle}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        {isContainer ? null : (
          <span
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            aria-label={`Drag ${TYPE_LABEL[node.type]}`}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab touch-none rounded px-1 text-[var(--text-muted)] opacity-0 hover:text-[var(--text-primary)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)] group-hover:opacity-100"
          >
            <GripVertical size={16} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
          {TYPE_LABEL[node.type]}
          <span className="ml-2 truncate font-normal text-[var(--text-muted)]">
            {summaryOf(node)}
          </span>
        </span>
        <button
          type="button"
          aria-label={`Remove ${TYPE_LABEL[node.type]}`}
          onClick={(e) => {
            e.stopPropagation();
            removeNode(id);
          }}
          className="rounded-[var(--r-sm)] px-1.5 py-0.5 text-[var(--text-muted)] opacity-0 hover:bg-[var(--bg-elevated)] hover:text-[var(--danger)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)] group-hover:opacity-100"
        >
          <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div
        className="px-3 pb-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <EditorFor node={node} />
      </div>

      {hasChildren ? (
        <div className="flex flex-col gap-2 px-3 pb-3" role="group" aria-label={`${TYPE_LABEL[node.type]} children`}>
          {childIds
            .filter((cid) => cid !== accessoryId)
            .map((cid) => (
              <NodeRenderer key={cid} id={cid} level={level + 1} />
            ))}
          {accessoryId !== null ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Accessory
              </span>
              <NodeRenderer id={accessoryId} level={level + 1} />
            </div>
          ) : null}
          <DropZone parentId={id} compact />
        </div>
      ) : null}
    </div>
  );
}

const NodeRenderer = memo(NodeRendererInner);
export default NodeRenderer;
