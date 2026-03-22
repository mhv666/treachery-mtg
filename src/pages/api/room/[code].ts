import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { rooms, players } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  try {
    const code = params.code?.toUpperCase();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Room code is required' }), { status: 400 });
    }

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    const roomPlayers = await db
      .select({
        id: players.id,
        name: players.name,
        isCreator: players.isCreator,
        role: players.role,
      })
      .from(players)
      .where(eq(players.roomId, room.id));

    return new Response(JSON.stringify({ 
        status: room.status, 
        players: roomPlayers.map(p => ({
            id: p.id,
            name: p.name,
            isCreator: p.isCreator,
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
