import type { APIRoute } from 'astro';
import db from '../../db';
import { gameEvents } from '../../lib/events';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerName } = data;

    if (!code || !playerName) {
      return new Response(JSON.stringify({ error: 'Room code and player name are required' }), { status: 400 });
    }

    const roomCode = code.toUpperCase();
    
    const room = db.prepare('SELECT id, status FROM rooms WHERE code = ?').get(roomCode) as { id: string, status: string } | undefined;

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    if (room.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game has already started' }), { status: 400 });
    }

    const playersResp = db.prepare('SELECT count(*) as count FROM players WHERE room_id = ?').get(room.id) as { count: number };
    
    if (playersResp.count >= 5) {
      return new Response(JSON.stringify({ error: 'Room is full (max 5 players)' }), { status: 400 });
    }

    // Check if player name already exists in room
    const existingPlayer = db.prepare('SELECT id FROM players WHERE room_id = ? AND name = ?').get(room.id, playerName);
    if (existingPlayer) {
      return new Response(JSON.stringify({ error: 'Name already taken in this room' }), { status: 400 });
    }

    const playerId = crypto.randomUUID();
    db.prepare('INSERT INTO players (id, room_id, name, is_creator) VALUES (?, ?, ?, ?)').run(playerId, room.id, playerName, 0);

    gameEvents.emit('roomUpdated', roomCode);

    return new Response(JSON.stringify({ code: roomCode, playerId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
