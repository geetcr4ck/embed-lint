import { describe, expect, it } from 'vitest';
import { DiscordPayloadSchema, parseJsonPayload } from '../../lib/schema/payload';

// Ref: §16 - root is always { component: Container(type 17) }.
describe('DiscordPayload', () => {
  it('valid: root component is a container', () => {
    expect(
      DiscordPayloadSchema.safeParse({
        component: {
          type: 17,
          components: [{ type: 10, content: 'Hello' }],
        },
      }).success,
    ).toBe(true);
  });

  it('invalid: empty root', () => {
    expect(DiscordPayloadSchema.safeParse({}).success).toBe(false);
  });

  it('invalid: component is not a container', () => {
    expect(
      DiscordPayloadSchema.safeParse({
        component: { type: 10, content: 'Hello' },
      }).success,
    ).toBe(false);
  });

  it('invalid: extra key at root', () => {
    expect(
      DiscordPayloadSchema.safeParse({
        component: { type: 17, components: [] },
        content: 'x',
      }).success,
    ).toBe(false);
  });

  it('parseJsonPayload: valid JSON string becomes a payload', () => {
    const payload = parseJsonPayload('{"component":{"type":17,"components":[]}}');
    expect(payload.component.type).toBe(17);
  });

  it('parseJsonPayload: off-schema JSON throws', () => {
    expect(() => parseJsonPayload('{"component":{"type":10}}')).toThrow();
  });
});
