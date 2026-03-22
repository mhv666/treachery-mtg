import type { APIRoute } from 'astro';
import sql from '../../db';
import { gameEvents } from '../../lib/events';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerName } = data;

    if (!code || !playerName) {
      return new Response(JSON.stringify({ error: 'Room code and player name are required' }), { status: 400 });
    }

    const roomCode = code.toUpperCase();
    
    const [room] = await sql<[{ id: string, status: string }]>`
      SELECT id, status FROM rooms WHERE code = ${roomCode}
    `;

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    if (room.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game has already started' }), { status: 400 });
    }

    const [playersResp] = await sql<[{ count: bigint }]>`
      SELECT count(*) as count FROM players WHERE room_id = ${room.id}
    `;
    
    if (Number(playersResp.count) >= 5) {
      return new Response(JSON.stringify({ error: 'Room is full (max 5 players)' }), { status: 400 });
    }

    const [existingPlayer] = await sql`
      SELECT id FROM players WHERE room_id = ${room.id} AND name = ${playerName}
    `;
    if (existingPlayer) {
      return new Response(JSON.stringify({ error: 'Name already taken in this room' }), { status: 400 });
    }

    const playerId = crypto.randomUUID();
    await sql`INSERT INTO players (id, room_id, name, is_creator) VALUES (${playerId}, ${room.id}, ${playerName}, false)`;

    gameEvents.emit('roomUpdated', roomCode);

    return new Response(JSON.stringify({ code: roomCode, playerId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
