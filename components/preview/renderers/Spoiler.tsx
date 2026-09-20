'use client';

// Ref: DESIGN.md §4.7 (Discord spoiler), ARCHITECTURE.md §11.
// Generic spoiler: blur + click toggle, Enter/Space toggles, Esc hides.

import { useState, type ReactNode } from 'react';

interface SpoilerProps {
  label: string;
  children: ReactNode;
}

export default function Spoiler({ label, children }: SpoilerProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={revealed}
      onClick={() => setRevealed((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setRevealed((v) => !v);
        } else if (e.key === 'Escape') {
          setRevealed(false);
        }
      }}
      className={
        revealed
          ? 'cursor-pointer'
          : 'cursor-pointer select-none bg-[var(--spoiler-bg)] text-transparent blur-sm'
      }
    >
      {children}
    </span>
  );
}
