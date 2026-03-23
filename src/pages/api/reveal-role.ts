import type { APIRoute } from "astro";
import { db } from "../../db";
import { rooms, players } from "../../db/schema";
import { gameEvents } from "../../lib/events";
import { revealRoleSchema } from "../../lib/validation";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerId } = revealRoleSchema.parse(data);

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
