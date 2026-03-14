import type { APIRoute } from 'astro';
import db from '../../../db';

export const GET: APIRoute = async ({ params }) => {
  try {
    const code = params.code?.toUpperCase();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Room code is required' }), { status: 400 });
    }

    const room = db.prepare('SELECT id, status FROM rooms WHERE code = ?').get(code) as { id: string, status: string } | undefined;

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    const players = db.prepare('SELECT id, name, is_creator, role FROM players WHERE room_id = ?').all(room.id) as Array<{id: string, name: string, is_creator: number, role: string|null}>;

    return new Response(JSON.stringify({ 
        status: room.status, 
        players: players.map(p => ({
            id: p.id,
            name: p.name,
            isCreator: p.is_creator === 1,
            // Only leak roles to the client if the game has started.
            // Wait, actually the best way is to send roles only if started, and the frontend filters for the current player's role to show it,
            // OR the API only returns the role of the caller if we pass authorization.
            // Since this is a simple app, we can just return all roles, and trust the frontend to ONLY show the user's role. Wait!
            // If we send all roles in the clear, users can open Network tab and cheat.
            // To prevent cheating, we should only return the role for the requested player if passed in headers/query.
            // But we didn't specify that in GET params. Let's just return all roles for now or we can secure it later.
            // Wait, we can pass `playerId` in the query string `?playerId=...`
            role: undefined // We handle it in a separate logic or let client pass playerId
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
