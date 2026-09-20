'use client';

// Ref: DESIGN.md §4.5 (error panel) + §7 (validation live region).
// Issue list from validate(): code + path + message + hint.
// Clicking an item selects the related node (when mapped), then scrolls and focuses.

import { AlertTriangle, CircleAlert, CircleCheck } from 'lucide-react';
import { useDocumentStore } from '@/lib/store/document';
import type { BuilderNode, NodeId } from '@/lib/serializer/types';
import type { JsonPath } from '@/lib/validator/rules/types';
import { useInspectedPayload } from './usePayload';

/** Format path JSON: component.components[2].url */
function formatPath(path: JsonPath): string {
  let out = '';
  for (const seg of path) {
    if (typeof seg === 'number') {
      out += `[${seg.toString()}]`;
    } else if (out === '') {
      out = seg;
    } else {
      out += `.${seg}`;
    }
  }
  return out === '' ? '(root)' : out;
}

/**
 * Map a payload path to a tree node id. Stops at the deepest recognized
 * node; returns null when nothing matches.
 */
function resolveNodeId(
  nodes: Record<NodeId, BuilderNode>,
  rootId: NodeId | null,
  path: JsonPath,
): NodeId | null {
  if (rootId === null || path.length === 0 || path[0] !== 'component') return null;
  let current: NodeId = rootId;
  let i = 1;
  while (i < path.length) {
    const node = nodes[current];
    if (node === undefined) return null;
    const seg = path[i];
    if (seg === 'components') {
      const idx = path[i + 1];
      if (typeof idx !== 'number') return current;
      if (node.type !== 17 && node.type !== 9 && node.type !== 1) return current;
      const cid = node.children[idx];
      if (cid === undefined) return current;
      current = cid;
      i += 2;
      continue;
    }
    if (seg === 'accessory') {
      if (node.type !== 9 || node.accessoryId === undefined) return current;
      current = node.accessoryId;
      i += 1;
      continue;
    }
    break;
  }
  return current;
}

export default function ErrorPanel() {
  const { hasRoot, result } = useInspectedPayload();
  const nodes = useDocumentStore((s) => s.doc.nodes);
  const rootId = useDocumentStore((s) => s.doc.rootId);
  const select = useDocumentStore((s) => s.select);

  const focusNode = (target: NodeId): void => {
    select(target);
    const el = document.getElementById(`builder-node-${target}`);
    if (el === null) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    el.focus({ preventScroll: true });
  };

  if (!hasRoot || result === null) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Error
        </h2>
        <p className="text-sm text-[var(--text-muted)]">No components to validate yet.</p>
      </div>
    );
  }

  const errors = result.issues.filter((issue) => issue.severity === 'error');
  const warnings = result.issues.filter((issue) => issue.severity === 'warning');

  const summary =
    errors.length > 0
      ? `${errors.length.toString()} errors to fix`
      : warnings.length > 0
        ? `${warnings.length.toString()} warnings`
        : 'Payload valid, ready to paste';

  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {errors.length > 0 ? (
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="text-[var(--danger)]" />
        ) : warnings.length > 0 ? (
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" className="text-[var(--warning)]" />
        ) : (
          <CircleCheck size={16} strokeWidth={1.5} aria-hidden="true" className="text-[var(--success)]" />
        )}
        Error
      </h2>
      <p
        aria-live="polite"
        className={[
          'text-sm',
          errors.length > 0
            ? 'text-[var(--danger)]'
            : warnings.length > 0
              ? 'text-[var(--warning)]'
              : 'text-[var(--success)]',
        ].join(' ')}
      >
        {summary}
      </p>
      {result.issues.length === 0 ? null : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {result.issues.map((issue, index) => {
            const target = resolveNodeId(nodes, rootId, issue.path);
            const key = `${issue.code}-${index.toString()}`;
            return (
              <li
                key={key}
                className="rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2"
              >
                <button
                  type="button"
                  disabled={target === null}
                  onClick={() => {
                    if (target !== null) focusNode(target);
                  }}
                  aria-label={`${issue.code}. ${issue.message} ${target === null ? '' : 'Select the related node.'}`}
                  className="flex w-full flex-col gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)] disabled:cursor-default"
                >
                  <span
                    className={[
                      'flex items-center gap-1.5 font-mono text-xs font-semibold',
                      issue.severity === 'error'
                        ? 'text-[var(--danger)]'
                        : 'text-[var(--warning)]',
                    ].join(' ')}
                  >
                    {issue.severity === 'error' ? (
                      <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {issue.code}
                  </span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {formatPath(issue.path)}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]">{issue.message}</span>
                  {issue.hint ? (
                    <span className="text-xs text-[var(--text-secondary)]">
                      {'\u2192'} {issue.hint}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
