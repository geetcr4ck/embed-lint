import { buttonKeysRule, buttonLabelOrEmojiRule, buttonStyleRule } from './button';
import { maxBytesRule, maxComponentsRule } from './limits';
import { mediaFormatRule, mediaShapeRule, mediaUrlLengthRule } from './media';
import { rootShapeRule } from './root';
import { accentColorRule, containerChildTypeRule, sectionShapeRule } from './structure';
import type { Rule } from './types';

// All 12 rules (ARCH §7.3). Order determines issue order.
export const allRules: Rule[] = [
  rootShapeRule,
  maxComponentsRule,
  maxBytesRule,
  buttonKeysRule,
  buttonStyleRule,
  buttonLabelOrEmojiRule,
  mediaShapeRule,
  mediaUrlLengthRule,
  mediaFormatRule,
  containerChildTypeRule,
  sectionShapeRule,
  accentColorRule,
];

export type { Rule, ValidationIssue, ValidationResult, ValidationStats } from './types';
