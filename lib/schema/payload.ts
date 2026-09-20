import { z } from 'zod';
import { ContainerSchema, type DiscordContainer } from './component';

// Ref: §16 - root is always { component: Container(type 17) }.
export const DiscordPayloadSchema = z
  .object({
    component: ContainerSchema,
  })
  .strict();

export type DiscordPayload = z.infer<typeof DiscordPayloadSchema>;
export type { DiscordContainer };

/**
 * Parse a JSON string into a DiscordPayload.
 * The only JSON.parse narrowing site: unknown to Zod parse (no `as`).
 */
export function parseJsonPayload(json: string): DiscordPayload {
  const data: unknown = JSON.parse(json);
  return DiscordPayloadSchema.parse(data);
}
