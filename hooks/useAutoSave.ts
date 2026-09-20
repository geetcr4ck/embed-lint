// Ref: ARCHITECTURE.md §12 (Persistence: localStorage debounce 500ms).
// Auto-save document snapshot to localStorage + autoload on mount.

import { useEffect } from 'react';
import { useDocumentStore, type DocumentStore } from '../lib/store/document';

/** Storage key per ARCHITECTURE.md §12. */
export const AUTOSAVE_KEY = 'embedlint:doc';
export const AUTOSAVE_VERSION = 1;

export interface AutoSaveOptions {
  /** Write debounce after the last mutation (default 500ms). */
  delay?: number;
  /** Load saved state into the store on mount when the document is empty (default true). */
  autoload?: boolean;
  /** localStorage key (default AUTOSAVE_KEY). */
  storageKey?: string;
}

/** Stable serialization of { nodes, rootId } for change detection. */
function serializeDoc(s: DocumentStore): string {
  return JSON.stringify({ v: AUTOSAVE_VERSION, nodes: s.doc.nodes, rootId: s.doc.rootId });
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Quota full / private mode: auto-save silently skipped.
  }
}

export function useAutoSave(options: AutoSaveOptions = {}): void {
  const { delay = 500, autoload = true, storageKey = AUTOSAVE_KEY } = options;

  useEffect(() => {
    if (autoload) {
      const state = useDocumentStore.getState();
      const empty = Object.keys(state.doc.nodes).length === 0 && state.doc.rootId === null;
      if (empty) {
        const raw = readStorage(storageKey);
        if (raw !== null) {
          try {
            state.importSnapshot(raw);
          } catch {
            // Corrupt snapshot: ignore, start from an empty document.
          }
        }
      }
    }

    let last = serializeDoc(useDocumentStore.getState());
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useDocumentStore.subscribe((s) => {
      const snap = serializeDoc(s);
      if (snap === last) return;
      last = snap;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        writeStorage(storageKey, s.exportSnapshot());
        timer = undefined;
      }, delay);
    });

    return () => {
      unsubscribe();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [delay, autoload, storageKey]);
}
