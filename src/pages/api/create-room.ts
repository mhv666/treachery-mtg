import type { APIRoute } from 'astro';
import sql from '../../db';
import { gameEvents } from '../../lib/events';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const playerName = data.playerName;

    if (!playerName) {
      return new Response(JSON.stringify({ error: 'Player name is required' }), { status: 400 });
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const roomId = crypto.randomUUID();
    const playerId = crypto.randomUUID();

    await sql.begin(async (tx) => {
        await tx`INSERT INTO rooms (id, code, status) VALUES (${roomId}, ${code}, 'waiting')`;
        await tx`INSERT INTO players (id, room_id, name, is_creator) VALUES (${playerId}, ${roomId}, ${playerName}, true)`;
    });

    gameEvents.emit('roomUpdated', code);

    return new Response(JSON.stringify({ code, playerId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
