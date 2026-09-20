import { describe, expect, it } from 'vitest';
import {
  ActionRowSchema,
  ButtonSchema,
  ContainerSchema,
  MediaGallerySchema,
  SectionSchema,
  SeparatorSchema,
  TextDisplaySchema,
  ThumbnailSchema,
} from '../../lib/schema/component';

const textDisplay = { type: 10, content: '# Patch Notes' } as const;
const button = { type: 2, style: 5, url: 'https://example.com/release', label: 'Open' } as const;
const thumbnail = { type: 11, media: { url: 'https://example.com/img.png' } } as const;

describe('Zod component schemas', () => {
  it('valid container: accent + children', () => {
    expect(
      ContainerSchema.safeParse({
        type: 17,
        accent_color: 0x5865f2,
        components: [textDisplay, { type: 14, divider: true, spacing: 1 }],
      }).success,
    ).toBe(true);
  });

  it('invalid container: nested container', () => {
    expect(
      ContainerSchema.safeParse({
        type: 17,
        components: [{ type: 17, components: [] }],
      }).success,
    ).toBe(false);
  });

  it('valid action row: contains a button', () => {
    expect(ActionRowSchema.safeParse({ type: 1, components: [button] }).success).toBe(true);
  });

  it('invalid action row: contains a text display', () => {
    expect(ActionRowSchema.safeParse({ type: 1, components: [textDisplay] }).success).toBe(false);
  });

  it('valid button: style 5 + key whitelist', () => {
    expect(ButtonSchema.safeParse(button).success).toBe(true);
  });

  it('invalid button: style != 5', () => {
    expect(ButtonSchema.safeParse({ ...button, style: 4 }).success).toBe(false);
  });

  it('invalid button: extra key (custom_id)', () => {
    const result = ButtonSchema.safeParse({ ...button, custom_id: 'click' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.code === 'unrecognized_keys')).toBe(true);
    }
  });

  it('valid section: text + thumbnail accessory', () => {
    expect(
      SectionSchema.safeParse({ type: 9, components: [textDisplay], accessory: thumbnail }).success,
    ).toBe(true);
  });

  it('invalid section: 4 text displays', () => {
    expect(
      SectionSchema.safeParse({
        type: 9,
        components: [textDisplay, textDisplay, textDisplay, textDisplay],
      }).success,
    ).toBe(false);
  });

  it('valid text display', () => {
    expect(TextDisplaySchema.safeParse(textDisplay).success).toBe(true);
  });

  it('invalid text display: missing content', () => {
    expect(TextDisplaySchema.safeParse({ type: 10 }).success).toBe(false);
  });

  it('valid thumbnail', () => {
    expect(ThumbnailSchema.safeParse(thumbnail).success).toBe(true);
  });

  it('invalid thumbnail: extra key in media', () => {
    expect(
      ThumbnailSchema.safeParse({
        type: 11,
        media: { url: 'https://example.com/img.png', foo: 'x' },
      }).success,
    ).toBe(false);
  });

  it('valid gallery: item + description', () => {
    expect(
      MediaGallerySchema.safeParse({
        type: 12,
        items: [{ media: { url: 'https://example.com/v.mp4' }, description: 'Trailer' }],
      }).success,
    ).toBe(true);
  });

  it('invalid gallery: extra key in item', () => {
    expect(
      MediaGallerySchema.safeParse({
        type: 12,
        items: [{ media: { url: 'https://example.com/v.mp4' }, width: 100 }],
      }).success,
    ).toBe(false);
  });

  it('valid separator', () => {
    expect(SeparatorSchema.safeParse({ type: 14, divider: false, spacing: 2 }).success).toBe(true);
  });

  it('invalid separator: spacing 3', () => {
    expect(SeparatorSchema.safeParse({ type: 14, spacing: 3 }).success).toBe(false);
  });
});
