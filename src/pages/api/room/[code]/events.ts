import type { APIRoute } from 'astro';
import db from '../../../../db';
import { gameEvents } from '../../../../lib/events';

export const GET: APIRoute = async ({ params, request }) => {
  const code = params.code?.toUpperCase();

  if (!code) {
    return new Response('Room code is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = () => {
        try {
          const room = db.prepare('SELECT id, status FROM rooms WHERE code = ?').get(code) as { id: string, status: string } | undefined;
          if (!room) return;

          const players = db.prepare('SELECT id, name, is_creator, role FROM players WHERE room_id = ?').all(room.id) as Array<{id: string, name: string, is_creator: number, role: string|null}>;

          const data = {
            status: room.status,
            players: players.map(p => ({
                id: p.id,
                name: p.name,
                isCreator: p.is_creator === 1,
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

      // Initial push
      sendUpdate();

      // Keep alive
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
