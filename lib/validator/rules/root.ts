import type { Rule, ValidationIssue } from './types';

// Ref: §16 - root must be { component: Container (type 17) }.
// Parsed payloads always pass; defensive implementation (via unknown,
// no `as`) so direct calls with malformed data are still caught.
export const rootShapeRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  const component: unknown = payload.component;
  if (typeof component !== 'object' || component === null || !('type' in component)) {
    issues.push({
      severity: 'error',
      path: ['component'],
      code: 'ROOT_SHAPE',
      message: 'Root payload must be { component: Container (type 17) }.',
      hint: 'Wrap the payload as { "component": { "type": 17, "components": [...] } }.',
    });
    return issues;
  }
  const type: unknown = component.type;
  if (type !== 17) {
    issues.push({
      severity: 'error',
      path: ['component', 'type'],
      code: 'ROOT_SHAPE',
      message: 'Root "component" must be a Container with type 17.',
      hint: 'Change "component.type" to 17.',
    });
  }
  return issues;
};
