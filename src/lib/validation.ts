import { z } from "zod";

const MAX_PLAYER_NAME_LENGTH = 30;
const PLAYER_NAME_REGEX = /^[\w\s]+$/;

export const playerNameSchema = z
  .string()
  .min(1, "Player name is required")
  .max(
    MAX_PLAYER_NAME_LENGTH,
    `Player name must be ${MAX_PLAYER_NAME_LENGTH} characters or less`,
  )
  .trim()
  .regex(
    PLAYER_NAME_REGEX,
    "Player name can only contain letters, numbers, and spaces",
  );

export const roomCodeSchema = z
  .string()
  .length(4, "Room code must be 4 characters")
  .regex(/^[A-Z]{4}$/, "Room code must be 4 uppercase letters");

export const uuidSchema = z.string().uuid("Invalid player ID format");

export const createRoomSchema = z.object({
  playerName: playerNameSchema,
});

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  playerName: playerNameSchema,
});

export const startGameSchema = z.object({
  code: roomCodeSchema,
  playerId: uuidSchema,
});

export const revealRoleSchema = z.object({
  code: roomCodeSchema,
  playerId: uuidSchema,
});

export function parseBody<T extends z.ZodSchema>(
  schema: T,
  body: unknown,
): z.infer<T> {
  return schema.parse(body);
}
