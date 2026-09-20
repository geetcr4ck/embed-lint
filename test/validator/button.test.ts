import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validator';

// Ref: §17 - Buttons: key whitelist, style 5, label or emoji required.
function containerWithButton(button: unknown): unknown {
  return {
    component: {
      type: 17,
      components: [{ type: 1, components: [button] }],
    },
  };
}

const validButton = { type: 2, style: 5, url: 'https://example.com/release', label: 'Open' };

describe('BUTTON_KEYS', () => {
  it('valid: whitelisted keys only', () => {
    expect(validate(containerWithButton(validButton)).ok).toBe(true);
  });

  it('invalid: custom_id (via action row)', () => {
    const result = validate(containerWithButton({ ...validButton, custom_id: 'click' }));
    expect(result.ok).toBe(false);
    const issue = result.issues.find((item) => item.code === 'BUTTON_KEYS');
    expect(issue?.hint).toContain('type, url, style');
  });

  it('invalid: custom_id directly in container (union path)', () => {
    const result = validate({
      component: { type: 17, components: [{ ...validButton, custom_id: 'click' }] },
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'BUTTON_KEYS')).toBe(true);
  });
});

describe('BUTTON_STYLE', () => {
  it('invalid: style 4', () => {
    const result = validate(containerWithButton({ ...validButton, style: 4 }));
    expect(result.ok).toBe(false);
    const issue = result.issues.find((item) => item.code === 'BUTTON_STYLE');
    expect(issue?.path).toEqual(['component', 'components', 0, 'components', 0, 'style']);
  });

  it('invalid: style string', () => {
    const result = validate(containerWithButton({ ...validButton, style: 'link' }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'BUTTON_STYLE')).toBe(true);
  });
});

describe('BUTTON_NEEDS_LABEL_OR_EMOJI', () => {
  it('valid: emoji alone is enough', () => {
    const result = validate(
      containerWithButton({ type: 2, style: 5, url: 'https://example.com/', emoji: { name: '🎉' } }),
    );
    expect(result.ok).toBe(true);
  });

  it('invalid: no label and no emoji', () => {
    const result = validate(containerWithButton({ type: 2, style: 5, url: 'https://example.com/' }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'BUTTON_NEEDS_LABEL_OR_EMOJI')).toBe(true);
  });
});
