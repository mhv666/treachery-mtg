import type { APIRoute } from 'astro';
import db from '../../db';
import { gameEvents } from '../../lib/events';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const playerName = data.playerName;

    if (!playerName) {
      return new Response(JSON.stringify({ error: 'Player name is required' }), { status: 400 });
    }

    // Generate a simple 4 letter room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // In a real app we'd verify the code is unique, but 4 letters is enough for this
    
    const roomId = crypto.randomUUID();
    const playerId = crypto.randomUUID();

    db.transaction(() => {
        db.prepare('INSERT INTO rooms (id, code, status) VALUES (?, ?, ?)').run(roomId, code, 'waiting');
        db.prepare('INSERT INTO players (id, room_id, name, is_creator) VALUES (?, ?, ?, ?)').run(playerId, roomId, playerName, 1);
    })();

    gameEvents.emit('roomUpdated', code);

    return new Response(JSON.stringify({ code, playerId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
