import type { APIRoute } from 'astro';
import sql from '../../db';
import { gameEvents } from '../../lib/events';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerId } = data;

    if (!code || !playerId) {
      return new Response(JSON.stringify({ error: 'Room code and player ID are required' }), { status: 400 });
    }

    const roomCode = code.toUpperCase();
    
    const [room] = await sql<[{ id: string, status: string }]>`
      SELECT id, status FROM rooms WHERE code = ${roomCode}
    `;

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    const [creator] = await sql<[{ is_creator: boolean }]>`
      SELECT is_creator FROM players WHERE id = ${playerId} AND room_id = ${room.id}
    `;
    
    if (!creator || creator.is_creator !== true) {
        return new Response(JSON.stringify({ error: 'Only the creator can start the game' }), { status: 403 });
    }

    const playersResp = await sql<[{id: string}]>`
      SELECT id FROM players WHERE room_id = ${room.id}
    `;
    
    if (playersResp.length !== 5) {
      return new Response(JSON.stringify({ error: 'Need exactly 5 players to start' }), { status: 400 });
    }

    const roles = ['Leader', 'Assassin', 'Assassin', 'Traitor', 'Guardian'];
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    await sql.begin(async (tx) => {
        await tx`UPDATE rooms SET status = 'started' WHERE id = ${room.id}`;
        
        for (let i = 0; i < 5; i++) {
            await tx`UPDATE players SET role = ${roles[i]} WHERE id = ${playersResp[i].id}`;
        }
    });

    gameEvents.emit('roomUpdated', roomCode);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
