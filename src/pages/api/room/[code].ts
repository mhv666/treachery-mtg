import type { APIRoute } from 'astro';
import sql from '../../../db';

export const GET: APIRoute = async ({ params }) => {
  try {
    const code = params.code?.toUpperCase();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Room code is required' }), { status: 400 });
    }

    const [room] = await sql<[{ id: string, status: string }]>`
      SELECT id, status FROM rooms WHERE code = ${code}
    `;

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    const players = await sql<[{id: string, name: string, is_creator: boolean, role: string | null}]>`
      SELECT id, name, is_creator, role FROM players WHERE room_id = ${room.id}
    `;

    return new Response(JSON.stringify({ 
        status: room.status, 
        players: players.map(p => ({
            id: p.id,
            name: p.name,
            isCreator: p.is_creator,
            role: undefined
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
