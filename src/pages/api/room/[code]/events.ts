import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { rooms, players } from '../../../../db/schema';
import { gameEvents } from '../../../../lib/events';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, request }) => {
  const code = params.code?.toUpperCase();

  if (!code) {
    return new Response('Room code is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = async () => {
        try {
          const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
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

          const data = {
            status: room.status,
            players: roomPlayers.map(p => ({
                id: p.id,
                name: p.name,
                isCreator: p.isCreator,
                role: undefined 
            }))
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          console.error('Error fetching room state for SSE', e);
        }
      };

      const handleUpdate = (updatedCode: string) => {
        if (updatedCode === code) {
          sendUpdate();
        }
      };

      gameEvents.on('roomUpdated', handleUpdate);

      sendUpdate();

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        gameEvents.off('roomUpdated', handleUpdate);
        clearInterval(interval);
        try { controller.close(); } catch (e) {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
};
