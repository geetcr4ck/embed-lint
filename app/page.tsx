'use client';

// Ref: DESIGN.md §2.1 (desktop 3-column) + §2.2 (tablet drawer) + §2.3
// (mobile Build/Preview/Export tabs + palette bottom sheet) + §7 (keyboard/ARIA).
// Page mounts the builder inside ONE BuilderDndProvider. Right panel: preview,
// errors, JSON, export, import. Desktop unchanged.

import { useEffect, useRef, useState, type RefObject } from 'react';
import { PanelLeft, Redo2, Undo2, X } from 'lucide-react';
import { BuilderDndProvider } from '@/components/builder/Canvas';
import Canvas from '@/components/builder/Canvas';
import Palette from '@/components/builder/Palette';
import ExportPanel from '@/components/export/ExportPanel';
import ImportPanel from '@/components/export/ImportPanel';
import ErrorPanel from '@/components/inspector/ErrorPanel';
import JsonInspector from '@/components/inspector/JsonInspector';
import StatusBar from '@/components/inspector/StatusBar';
import DiscordPreview from '@/components/preview/DiscordPreview';
import { useDocumentStore } from '@/lib/store/document';
import { useCanRedo, useCanUndo } from '@/lib/store/selectors';

type MobileTab = 'build' | 'preview' | 'export';

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
];

const navBtn =
  'rounded-[var(--r-sm)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]';

function Topbar({
  paletteOpen,
  onTogglePalette,
  triggerRef,
}: {
  paletteOpen: boolean;
  onTogglePalette: () => void;
  triggerRef: RefObject<HTMLButtonElement>;
}) {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);

  return (
    <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] bg-[var(--brand-blurple)] text-sm font-bold text-white"
      >
        E
      </span>
      <span className="text-lg font-bold text-[var(--text-primary)]">EmbedLint</span>
      <nav aria-label="History" className="ml-2 flex items-center gap-1">
        <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" className={navBtn}>
          <Undo2 size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo" className={navBtn}>
          <Redo2 size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button
          ref={triggerRef}
          type="button"
          onClick={onTogglePalette}
          aria-expanded={paletteOpen}
          aria-controls="palette-panel"
          aria-label={paletteOpen ? 'Close component palette' : 'Open component palette'}
          className={`${navBtn} lg:hidden`}
        >
          <PanelLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </nav>
      <span className="ml-auto hidden text-xs text-[var(--text-muted)] sm:block">
        Builder client side, autosaved in your browser.
      </span>
    </header>
  );
}

function MobileTabs({ tab, onChange }: { tab: MobileTab; onChange: (t: MobileTab) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (next: MobileTab): void => {
    onChange(next);
    const idx = MOBILE_TABS.findIndex((t) => t.id === next);
    refs.current[idx]?.focus();
  };

  return (
    <nav
      role="tablist"
      aria-label="View mode"
      onKeyDown={(e) => {
        const idx = MOBILE_TABS.findIndex((t) => t.id === tab);
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          move(MOBILE_TABS[(idx + 1) % MOBILE_TABS.length]?.id ?? 'build');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          move(MOBILE_TABS[(idx - 1 + MOBILE_TABS.length) % MOBILE_TABS.length]?.id ?? 'build');
        } else if (e.key === 'Home') {
          e.preventDefault();
          move('build');
        } else if (e.key === 'End') {
          e.preventDefault();
          move('export');
        }
      }}
      className="flex gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 md:hidden"
    >
      {MOBILE_TABS.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={tab === t.id}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={[
            'flex-1 rounded-[var(--r-sm)] px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]',
            tab === t.id
              ? 'bg-[var(--brand-blurple)] font-semibold text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export default function HomePage() {
  const [tab, setTab] = useState<MobileTab>('build');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const switchTab = (next: MobileTab): void => {
    setTab(next);
    setPaletteOpen(false);
  };

  useEffect(() => {
    if (paletteOpen) closeRef.current?.focus();
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Topbar
        paletteOpen={paletteOpen}
        onTogglePalette={() => setPaletteOpen((v) => !v)}
        triggerRef={triggerRef}
      />
      <MobileTabs tab={tab} onChange={switchTab} />
      <BuilderDndProvider>
        <div className="flex flex-1 flex-col gap-4 p-4 md:flex-row lg:flex-row">
          {paletteOpen ? (
            <div
              aria-hidden="true"
              onClick={() => setPaletteOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
          ) : null}
          <aside
            id="palette-panel"
            aria-label="Palette"
            className={[
              'bg-[var(--bg-surface)] p-3',
              paletteOpen ? 'block' : 'hidden',
              'lg:static lg:z-auto lg:block lg:w-60 lg:shrink-0 lg:rounded-[var(--r-md)] lg:border lg:border-[var(--border-subtle)]',
              'max-lg:fixed max-lg:z-50 max-lg:border-[var(--border-subtle)]',
              'max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[70vh] max-md:overflow-y-auto max-md:rounded-t-[var(--r-lg)] max-md:border-x-0 max-md:border-b-0 max-md:border-t',
              'md:max-lg:bottom-0 md:max-lg:left-0 md:max-lg:top-0 md:max-lg:w-72 md:max-lg:overflow-y-auto md:max-lg:border-y-0 md:max-lg:border-l-0 md:max-lg:border-r',
            ].join(' ')}
          >
            <div className="mb-2 flex items-center justify-between lg:hidden">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Palette
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  setPaletteOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close palette"
                className="rounded-[var(--r-sm)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blurple)]"
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <Palette />
          </aside>

          <main
            role="tabpanel"
            id="panel-build"
            aria-labelledby="tab-build"
            className={`min-w-0 flex-1 flex-col gap-3 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 ${tab === 'build' ? 'flex' : 'hidden'} md:flex`}
          >
            <Canvas />
            <StatusBar />
          </main>

          <div
            className={`w-full shrink-0 flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 ${tab === 'build' ? 'hidden' : 'flex'} md:flex md:w-80 lg:w-[400px]`}
          >
            <section
              role="tabpanel"
              id="panel-preview"
              aria-labelledby="tab-preview"
              className={`${tab === 'preview' ? 'flex' : 'hidden'} flex-col gap-4 md:flex`}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Preview
              </h2>
              <DiscordPreview />
              <ErrorPanel />
            </section>
            <section
              role="tabpanel"
              id="panel-export"
              aria-labelledby="tab-export"
              className={`${tab === 'export' ? 'flex' : 'hidden'} flex-col gap-4 md:flex`}
            >
              <JsonInspector />
              <ExportPanel />
              <ImportPanel />
            </section>
          </div>
        </div>
      </BuilderDndProvider>
    </div>
  );
}
