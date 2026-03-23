import type { APIRoute } from "astro";
import { db } from "../../db";
import { rooms, players } from "../../db/schema";
import { gameEvents } from "../../lib/events";
import { createRoomSchema } from "../../lib/validation";
import { z } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { playerName } = createRoomSchema.parse(data);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const roomId = crypto.randomUUID();
    const playerId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(rooms).values({ id: roomId, code, status: "waiting" });
      await tx
        .insert(players)
        .values({ id: playerId, roomId, name: playerName, isCreator: true });
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
