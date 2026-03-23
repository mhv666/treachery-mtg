import type { APIRoute } from "astro";
import { db } from "../../db";
import { rooms, players, cards, playerCards } from "../../db/schema";
import { gameEvents } from "../../lib/events";
import { eq } from "drizzle-orm";
import {
  assignRoles,
  getRoleFromCard,
  shuffle,
  MIN_PLAYERS,
  MAX_PLAYERS,
  type Role,
} from "../../lib/game";

async function getRandomCardByRole(role: Role) {
  const rolePattern = `%${role}%`;
  const roleCards = await db
    .select()
    .from(cards)
    .where(eq(cards.subtype, role));

  if (roleCards.length === 0) {
    const fallbackCards = await db
      .select()
      .from(cards)
      .where(eq(cards.type, "Identity"));
    return fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
  }

  return roleCards[Math.floor(Math.random() * roleCards.length)];
}

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

    if (room.gamePhase === "countdown" || room.gamePhase === "started") {
      return new Response(
        JSON.stringify({ error: "Game has already started" }),
        { status: 400 },
      );
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
      .select()
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

    const shuffledPlayers = shuffle([...roomPlayers]);

    await db.transaction(async (tx) => {
      await tx
        .update(rooms)
        .set({ gamePhase: "countdown" })
        .where(eq(rooms.id, room.id));

      for (let i = 0; i < shuffledPlayers.length; i++) {
        const player = shuffledPlayers[i];
        const role = roles[i];

        await tx.update(players).set({ role }).where(eq(players.id, player.id));

        const identityCard = await getRandomCardByRole(role);

        await tx.insert(playerCards).values({
          playerId: player.id,
          cardId: identityCard.id,
        });
      }
    });

    gameEvents.emit("roomUpdated", roomCode);

    return new Response(
      JSON.stringify({ success: true, gamePhase: "countdown" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Start countdown error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
