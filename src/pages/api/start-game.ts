import type { APIRoute } from "astro";
import { db } from "../../db";
import { rooms, players } from "../../db/schema";
import { gameEvents } from "../../lib/events";
import { startGameSchema } from "../../lib/validation";
import { assignRoles, MIN_PLAYERS, MAX_PLAYERS } from "../../lib/game";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerId } = startGameSchema.parse(data);

    const roomCode = code;

    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, roomCode));

    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
      });
    }

    const [creator] = await db
      .select({ isCreator: players.isCreator })
      .from(players)
      .where(eq(players.id, playerId));

    if (!creator || creator.isCreator !== true) {
      return new Response(
        JSON.stringify({ error: "Only the creator can start the game" }),
        { status: 403 },
      );
    }

    const roomPlayers = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.roomId, room.id));

    const playerCount = roomPlayers.length;

    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
      return new Response(
        JSON.stringify({
          error: `Need between ${MIN_PLAYERS} and ${MAX_PLAYERS} players to start`,
        }),
        { status: 400 },
      );
    }

    const roles = assignRoles(playerCount);

    await db.transaction(async (tx) => {
      await tx
        .update(rooms)
        .set({ status: "started" })
        .where(eq(rooms.id, room.id));

      for (let i = 0; i < playerCount; i++) {
        await tx
          .update(players)
          .set({ role: roles[i] })
          .where(eq(players.id, roomPlayers[i].id));
      }
    });

    gameEvents.emit("roomUpdated", roomCode);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
