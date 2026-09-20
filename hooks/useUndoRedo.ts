// Shortcut keyboard global: undo/redo + hapus node terpilih.
// Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z / Ctrl+Y = redo, Delete/Backspace = hapus.
// Tidak membajak input teks (input/textarea/select/contentEditable dikecualikan).

import { useEffect } from 'react';
import { useDocumentStore } from '../lib/store/document';

export interface UndoRedoOptions {
  /** Aktifkan hapus via Delete/Backspace (default true). */
  deleteEnabled?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useUndoRedo(options: UndoRedoOptions = {}): {
  undo: () => void;
  redo: () => void;
} {
  const { deleteEnabled = true } = options;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const state = useDocumentStore.getState();

      if (mod && key === 'z' && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (mod && key === 'y' && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        state.redo();
        return;
      }
      if (deleteEnabled && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (mod || e.altKey || isEditableTarget(e.target)) return;
        const selectedId = state.doc.selectedId;
        if (selectedId === null) return;
        const node = state.doc.nodes[selectedId];
        // Jangan hapus Container root via keyboard (harus eksplisit via UI).
        if (!node || node.type === 17) return;
        e.preventDefault();
        state.removeNode(selectedId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteEnabled]);

  return {
    undo: () => useDocumentStore.getState().undo(),
    redo: () => useDocumentStore.getState().redo(),
  };
}
