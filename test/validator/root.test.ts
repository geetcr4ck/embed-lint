import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validator';

// Ref: §16 - root { component: Container (type 17) }.
describe('ROOT_SHAPE', () => {
  it('valid: root container', () => {
    const result = validate({ component: { type: 17, components: [] } });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('invalid: empty root', () => {
    const result = validate({});
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ROOT_SHAPE')).toBe(true);
  });

  it('invalid: component is not a container', () => {
    const result = validate({ component: { type: 10, content: 'Hello' } });
    expect(result.ok).toBe(false);
    const issue = result.issues.find((item) => item.code === 'ROOT_SHAPE');
    expect(issue?.path).toEqual(['component', 'type']);
  });

  it('invalid: string payload', () => {
    const result = validate('not a payload');
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ROOT_SHAPE')).toBe(true);
  });

  it('invalid: null payload', () => {
    const result = validate(null);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ROOT_SHAPE')).toBe(true);
  });
});
