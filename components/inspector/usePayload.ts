'use client';

// Shared inspector/export hook: tree -> payload (serialize) -> validate,
// with 200ms debounce per ARCHITECTURE.md §15 and AGENTS.md §9.

import { useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { DiscordPayload } from '@/lib/schema/payload';
import { toJson } from '@/lib/serializer/toJson';
import { validate, type ValidationResult } from '@/lib/validator/index';
import { useDocumentStore } from '@/lib/store/document';

export interface InspectedPayload {
  hasRoot: boolean;
  payload: DiscordPayload | null;
  pretty: string;
  result: ValidationResult | null;
}

export function useInspectedPayload(): InspectedPayload {
  const nodes = useDocumentStore((s) => s.doc.nodes);
  const rootId = useDocumentStore((s) => s.doc.rootId);

  const live = useMemo<DiscordPayload | null>(() => {
    if (rootId === null) return null;
    try {
      return toJson({ nodes, rootId });
    } catch {
      // Tree temporarily unserializable: panels stay honest.
      return null;
    }
  }, [nodes, rootId]);

  const payload = useDebounce(live, 200);
  const result = useMemo(
    () => (payload === null ? null : validate(payload)),
    [payload],
  );
  const pretty = useMemo(
    () => (payload === null ? '' : JSON.stringify(payload, null, 2)),
    [payload],
  );

  return { hasRoot: rootId !== null, payload, pretty, result };
}
