import type { APIRoute } from "astro";
import { db } from "../../db";
import { rooms, players } from "../../db/schema";
import { gameEvents } from "../../lib/events";
import { joinRoomSchema } from "../../lib/validation";
import { eq, sql, count } from "drizzle-orm";
import { z } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerName } = joinRoomSchema.parse(data);

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));

    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
      });
    }

    if (room.status !== "waiting") {
      return new Response(
        JSON.stringify({ error: "Game has already started" }),
        { status: 400 },
      );
    }

    const playerCountResult = await db
      .select({ count: count() })
      .from(players)
      .where(eq(players.roomId, room.id));

    if (playerCountResult[0].count >= 5) {
      return new Response(
        JSON.stringify({ error: "Room is full (max 5 players)" }),
        { status: 400 },
      );
    }

    const [existingPlayer] = await db
      .select()
      .from(players)
      .where(eq(players.roomId, room.id));

    const existingPlayerCheck = await db
      .select()
      .from(players)
      .where(
        sql`${players.roomId} = ${room.id} AND ${players.name} = ${playerName}`,
      );

    if (existingPlayerCheck.length > 0) {
      return new Response(
        JSON.stringify({ error: "Name already taken in this room" }),
        { status: 400 },
      );
    }

    const playerId = crypto.randomUUID();
    await db.insert(players).values({
      id: playerId,
      roomId: room.id,
      name: playerName,
      isCreator: false,
    });

    gameEvents.emit("roomUpdated", code);

    return new Response(JSON.stringify({ code, playerId }), {
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
