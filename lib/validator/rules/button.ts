import { BUTTON_ALLOWED_KEYS } from '../../schema/constants';
import type { Rule, ValidationIssue } from './types';
import { findExtraKeys, walkComponents } from './walk';

// Ref: §17 - Buttons only allow whitelisted keys.
export const buttonKeysRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type !== 2) {
      continue;
    }
    const extra = findExtraKeys(Object.keys(node), BUTTON_ALLOWED_KEYS);
    for (const key of extra) {
      issues.push({
        severity: 'error',
        path: [...path, key],
        code: 'BUTTON_KEYS',
        message: `Key "${key}" is not allowed on Button.`,
        hint: 'Remove this key; only type, url, style, label, emoji, disabled are valid.',
      });
    }
  }
  return issues;
};

// Ref: §17 - Buttons must use style 5 (link).
// Compare via unknown (no `as`) so malformed data stays meaningful.
export const buttonStyleRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type !== 2) {
      continue;
    }
    const style: unknown = node.style;
    if (style !== 5) {
      issues.push({
        severity: 'error',
        path: [...path, 'style'],
        code: 'BUTTON_STYLE',
        message: 'Button must use style 5 (link).',
        hint: 'Change "style" to 5.',
      });
    }
  }
  return issues;
};

// Ref: §17 - Link buttons need a label or emoji.
export const buttonLabelOrEmojiRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type !== 2) {
      continue;
    }
    if (node.label === undefined && node.emoji === undefined) {
      issues.push({
        severity: 'error',
        path,
        code: 'BUTTON_NEEDS_LABEL_OR_EMOJI',
        message: 'Link button needs a "label" or an "emoji".',
        hint: 'Add a "label" or an "emoji".',
      });
    }
  }
  return issues;
};
