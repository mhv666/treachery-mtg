import type { APIRoute } from "astro";
import { db } from "../../db";
import { rooms, players } from "../../db/schema";
import { gameEvents } from "../../lib/events";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerId } = data;

    if (!code || !playerId) {
      return new Response(
        JSON.stringify({ error: "Room code and player ID are required" }),
        { status: 400 },
      );
    }

    const roomCode = code.toUpperCase();

    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, roomCode));

    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
      });
    }

    if (room.gamePhase !== "countdown") {
      return new Response(
        JSON.stringify({ error: "Countdown has not started" }),
        { status: 400 },
      );
    }

    await db
      .update(rooms)
      .set({ status: "started", gamePhase: "started" })
      .where(eq(rooms.id, room.id));

    gameEvents.emit("roomUpdated", roomCode);

    return new Response(
      JSON.stringify({ success: true, gamePhase: "started" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
