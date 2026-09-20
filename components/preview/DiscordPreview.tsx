'use client';

// Ref: DESIGN.md §4.7 (Discord message preview panel) + §3 (tokens),
// ARCHITECTURE.md §11 (render from the tree, not JSON).
// Message frame: initial avatar + name + time, then content from the tree.
// Markdown styles (.discord-md) live in app/globals.css (static, anti
// hydration issues), using CSS vars to follow the theme.

import { useRootId } from '@/lib/store/selectors';
import PreviewNode from './renderers/PreviewNode';

export default function DiscordPreview() {
  const rootId = useRootId();

  return (
    <section aria-label="Discord preview" className="flex flex-col gap-2">
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blurple)] text-sm font-bold text-white"
        >
          E
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">EmbedLint</span>
            <span className="text-xs text-[var(--text-muted)]">Today</span>
          </p>
          {rootId === null ? (
            <p className="text-sm text-[var(--text-muted)]">
              No components yet, add some from the palette.
            </p>
          ) : (
            <PreviewNode id={rootId} />
          )}
        </div>
      </div>
    </section>
  );
}
