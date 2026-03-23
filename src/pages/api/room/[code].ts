import type { APIRoute } from "astro";
import { db } from "../../../db";
import { rooms, players, cards, playerCards } from "../../../db/schema";
import { roomCodeSchema } from "../../../lib/validation";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const GET: APIRoute = async ({ params }) => {
  try {
    const code = roomCodeSchema.parse(params.code?.toUpperCase());

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));

    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
      });
    }

    const roomPlayers = await db
      .select({
        id: players.id,
        name: players.name,
        isCreator: players.isCreator,
        role: players.role,
      })
      .from(players)
      .where(eq(players.roomId, room.id));

    const playersWithCards = await Promise.all(
      roomPlayers.map(async (p) => {
        const cardAssignment = await db
          .select({
            cardId: playerCards.cardId,
          })
          .from(playerCards)
          .where(eq(playerCards.playerId, p.id))
          .limit(1);

        let card = null;
        if (cardAssignment[0]) {
          const [cardData] = await db
            .select()
            .from(cards)
            .where(eq(cards.id, cardAssignment[0].cardId));
          card = cardData;
        }

        return {
          id: p.id,
          name: p.name,
          isCreator: p.isCreator,
          role: p.role,
          card: card
            ? {
                id: card.id,
                name: card.name,
                uri: card.uri,
                subtype: card.subtype,
                type: card.type,
                text: card.text,
                flavor: card.flavor,
                artist: card.artist,
                rarity: card.rarity,
                cost: card.cost,
                color: card.color,
              }
            : null,
        };
      }),
    );

    const shouldRevealRoles =
      room.gamePhase === "started" || room.status === "started";

    const response: Record<string, any> = {
      status: room.status,
      gamePhase: room.gamePhase,
      players: playersWithCards.map((p) => ({
        id: p.id,
        name: p.name,
        isCreator: p.isCreator,
        role: shouldRevealRoles ? p.role : undefined,
        card: shouldRevealRoles ? p.card : null,
      })),
    };

    return new Response(JSON.stringify(response), {
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
