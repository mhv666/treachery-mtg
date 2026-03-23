import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { rooms, players, cards, playerCards } from "../../../../db/schema";
import { gameEvents } from "../../../../lib/events";
import { roomCodeSchema } from "../../../../lib/validation";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const GET: APIRoute = async ({ params, request }) => {
  let code: string;
  try {
    code = roomCodeSchema.parse(params.code?.toUpperCase());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = async () => {
        try {
          const [room] = await db
            .select()
            .from(rooms)
            .where(eq(rooms.code, code));
          if (!room) return;

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

          const data = {
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

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch (e) {
          console.error("Error fetching room state for SSE", e);
        }
      };

      const handleUpdate = (updatedCode: string) => {
        if (updatedCode === code) {
          sendUpdate();
        }
      };

      gameEvents.on("roomUpdated", handleUpdate);

      sendUpdate();

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        gameEvents.off("roomUpdated", handleUpdate);
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* stream already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
