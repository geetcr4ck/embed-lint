import { ACCENT_COLOR_MAX, ACCENT_COLOR_MIN } from '../../schema/constants';
import type { Rule, ValidationIssue } from './types';
import { walkComponents } from './walk';

// Ref: §17 - direct Container children must be one of action row 1, section 9,
// text display 10, gallery 12, separator 14.
// Button (2) / Thumbnail (11) / nested Container (17) are not allowed directly.
const ALLOWED_CONTAINER_CHILDREN: readonly number[] = [1, 9, 10, 12, 14];

export const containerChildTypeRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  payload.component.components.forEach((child, index) => {
    const type: unknown = child.type;
    if (typeof type !== 'number' || !ALLOWED_CONTAINER_CHILDREN.includes(type)) {
      issues.push({
        severity: 'error',
        path: ['component', 'components', index],
        code: 'CONTAINER_CHILD_TYPE',
        message: `Type ${String(type)} cannot be a direct child of Container.`,
        hint: 'Put Buttons in an Action Row or Section accessory; use Thumbnails as Section accessories.',
      });
    }
  });
  return issues;
};

// Ref: §17 - Section: 1-3 Text Displays plus optional 1 accessory (Thumbnail/Button).
export const sectionShapeRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type !== 9) {
      continue;
    }
    if (node.components.length < 1 || node.components.length > 3) {
      issues.push({
        severity: 'error',
        path: [...path, 'components'],
        code: 'SECTION_SHAPE',
        message: `Section must contain 1-3 Text Displays (found ${node.components.length}).`,
        hint: 'Add or remove Text Displays to reach 1-3.',
      });
    }
    node.components.forEach((child, index) => {
      const type: unknown = child.type;
      if (type !== 10) {
        issues.push({
          severity: 'error',
          path: [...path, 'components', index],
          code: 'SECTION_SHAPE',
          message: 'Section children must be Text Display (type 10).',
          hint: 'Replace this with a Text Display; media/buttons go in "accessory".',
        });
      }
    });
    if (node.accessory !== undefined) {
      const accessoryType: unknown = node.accessory.type;
      if (accessoryType !== 11 && accessoryType !== 2) {
        issues.push({
          severity: 'error',
          path: [...path, 'accessory'],
          code: 'SECTION_SHAPE',
          message: 'Section accessory must be a Thumbnail (11) or Button (2).',
          hint: 'Replace the accessory with a Thumbnail or link Button.',
        });
      }
    }
  }
  return issues;
};

// Ref: §15/§9 - accent_color is an integer from 0 to 16777215.
export const accentColorRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type !== 17 || node.accent_color === undefined) {
      continue;
    }
    const value: unknown = node.accent_color;
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < ACCENT_COLOR_MIN ||
      value > ACCENT_COLOR_MAX
    ) {
      issues.push({
        severity: 'error',
        path: [...path, 'accent_color'],
        code: 'ACCENT_COLOR',
        message: 'accent_color must be an integer from 0 to 16777215.',
        hint: 'Use a 6-digit hex value, e.g. "#5865F2".',
      });
    }
  }
  return issues;
};
