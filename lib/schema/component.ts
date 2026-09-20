import { z } from 'zod';
import { ACCENT_COLOR_MAX, ACCENT_COLOR_MIN, MAX_URL_LENGTH } from './constants';

// Ref: PRD.md §5.3, ARCHITECTURE.md §5.2 + §7.3.
// Discord payload shape (snake_case). Schema is shape check only;
// semantic checks plus fix hints belong to the validator/rules lane.
// Every object is .strict(): extra keys are rejected at shape level
// (BUTTON_KEYS / MEDIA_SHAPE are re-enforced with hints in the validator).

const urlSchema = z.string().min(1).max(MAX_URL_LENGTH);

export const ButtonEmojiSchema = z
  .object({
    name: z.string().min(1),
    id: z.string().min(1).optional(),
    animated: z.boolean().optional(),
  })
  .strict();

// §17 - Buttons only allow style 5 (link) plus whitelisted keys.
export const ButtonSchema = z
  .object({
    type: z.literal(2),
    style: z.literal(5),
    url: urlSchema,
    label: z.string().min(1).optional(),
    emoji: ButtonEmojiSchema.optional(),
    disabled: z.boolean().optional(),
  })
  .strict();

// §18 - media is only { url }.
const MediaSchema = z
  .object({
    url: urlSchema,
  })
  .strict();

export const ThumbnailSchema = z
  .object({
    type: z.literal(11),
    media: MediaSchema,
  })
  .strict();

// §18 - gallery item: media plus optional description/spoiler.
const MediaGalleryItemSchema = z
  .object({
    media: MediaSchema,
    description: z.string().min(1).optional(),
    spoiler: z.boolean().optional(),
  })
  .strict();

export const MediaGallerySchema = z
  .object({
    type: z.literal(12),
    items: z.array(MediaGalleryItemSchema),
  })
  .strict();

export const TextDisplaySchema = z
  .object({
    type: z.literal(10),
    content: z.string(),
  })
  .strict();

export const SeparatorSchema = z
  .object({
    type: z.literal(14),
    divider: z.boolean().optional(),
    spacing: z.union([z.literal(1), z.literal(2)]).optional(),
  })
  .strict();

// §17 - Section: 1-3 Text Displays plus 1 accessory (Thumbnail or Button).
export const SectionSchema = z
  .object({
    type: z.literal(9),
    components: z.array(TextDisplaySchema).min(1).max(3),
    accessory: z.union([ThumbnailSchema, ButtonSchema]).optional(),
  })
  .strict();

// Read-only subset: Action Rows hold only link Buttons.
export const ActionRowSchema = z
  .object({
    type: z.literal(1),
    components: z.array(ButtonSchema),
  })
  .strict();

// Containers cannot nest: children are every type except 17.
const NonContainerComponentSchema = z.discriminatedUnion('type', [
  ActionRowSchema,
  ButtonSchema,
  SectionSchema,
  TextDisplaySchema,
  ThumbnailSchema,
  MediaGallerySchema,
  SeparatorSchema,
]);

// §16 - root Container.
export const ContainerSchema = z
  .object({
    type: z.literal(17),
    accent_color: z.number().int().min(ACCENT_COLOR_MIN).max(ACCENT_COLOR_MAX).optional(),
    spoiler: z.boolean().optional(),
    components: z.array(NonContainerComponentSchema),
  })
  .strict();

export const DiscordComponentSchema = z.discriminatedUnion('type', [
  ActionRowSchema,
  ButtonSchema,
  SectionSchema,
  TextDisplaySchema,
  ThumbnailSchema,
  MediaGallerySchema,
  SeparatorSchema,
  ContainerSchema,
]);

export type DiscordButton = z.infer<typeof ButtonSchema>;
export type DiscordThumbnail = z.infer<typeof ThumbnailSchema>;
export type DiscordMediaGallery = z.infer<typeof MediaGallerySchema>;
export type DiscordTextDisplay = z.infer<typeof TextDisplaySchema>;
export type DiscordSeparator = z.infer<typeof SeparatorSchema>;
export type DiscordSection = z.infer<typeof SectionSchema>;
export type DiscordActionRow = z.infer<typeof ActionRowSchema>;
export type DiscordContainer = z.infer<typeof ContainerSchema>;
export type DiscordComponent = z.infer<typeof DiscordComponentSchema>;
