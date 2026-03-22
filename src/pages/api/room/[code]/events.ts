import type { APIRoute } from 'astro';
import sql from '../../../../db';
import { gameEvents } from '../../../../lib/events';

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
          const [room] = await sql<[{ id: string, status: string }]>`
            SELECT id, status FROM rooms WHERE code = ${code}
          `;
          if (!room) return;

          const players = await sql<[{id: string, name: string, is_creator: boolean, role: string | null}]>`
            SELECT id, name, is_creator, role FROM players WHERE room_id = ${room.id}
          `;

          const data = {
            status: room.status,
            players: players.map(p => ({
                id: p.id,
                name: p.name,
                isCreator: p.is_creator,
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
