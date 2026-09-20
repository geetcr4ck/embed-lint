import { MAX_COMPONENTS, MAX_LINKED_BYTES } from '../../schema/constants';
import { byteSize } from '../byteSize';
import type { Rule, ValidationIssue } from './types';
import { countComponents } from './walk';

// Ref: §17 - at most 40 components total (including the root container).
export const maxComponentsRule: Rule = (payload) => {
  const count = countComponents(payload.component);
  if (count <= MAX_COMPONENTS) {
    return [];
  }
  return [
    {
      severity: 'error',
      path: ['component', 'components'],
      code: 'MAX_COMPONENTS',
      message: `Too many components: ${count}/40.`,
      hint: 'Remove or merge components to stay within 40 total.',
    },
  ];
};

// Ref: §15 - linked JSON is at most 3,000 raw bytes.
// Measured from JSON.stringify output (exactly the exported file bytes).
export const maxBytesRule: Rule = (payload) => {
  const bytes = byteSize(JSON.stringify(payload));
  if (bytes <= MAX_LINKED_BYTES) {
    return [];
  }
  return [
    {
      severity: 'error',
      path: [],
      code: 'MAX_BYTES',
      message: `JSON size ${bytes} bytes exceeds the 3,000 byte limit.`,
      hint: 'Shorten text/descriptions or reduce the component count.',
    },
  ];
};

/** Variant for payloads that fail parsing: takes the precomputed size. */
export function maxBytesIssue(rawBytes: number): ValidationIssue[] {
  if (rawBytes <= MAX_LINKED_BYTES) {
    return [];
  }
  return [
    {
      severity: 'error',
      path: [],
      code: 'MAX_BYTES',
      message: `JSON size ${rawBytes} bytes exceeds the 3,000 byte limit.`,
      hint: 'Shorten text/descriptions or reduce the component count.',
    },
  ];
}
