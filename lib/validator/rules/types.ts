import type { DiscordPayload } from '../../schema/payload';

// Ref: ARCHITECTURE.md §7.1 - validation result types. Pure: no React/DOM.
// Payload types are not redefined here (imported from lib/schema only).

export type Severity = 'error' | 'warning';

/** JSON pointer path, e.g. ['component', 'components', 0, 'style']. */
export type JsonPath = (string | number)[];

export interface ValidationIssue {
  severity: Severity;
  path: JsonPath;
  /** SCREAMING_SNAKE rule code, e.g. 'MAX_COMPONENTS'. */
  code: string;
  /** Concise human-readable message (English). */
  message: string;
  /** Fix suggestion (English). */
  hint?: string;
}

export interface ValidationStats {
  componentCount: number;
  rawBytes: number;
  totalMediaUrls: number;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  stats: ValidationStats;
}

/** Rule validator: pure function (payload) => issues. */
export type Rule = (payload: DiscordPayload) => ValidationIssue[];
