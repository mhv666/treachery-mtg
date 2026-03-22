import type { APIRoute } from 'astro';
import { db } from '../../db';
import { rooms, players } from '../../db/schema';
import { gameEvents } from '../../lib/events';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerId } = data;

    if (!code || !playerId) {
      return new Response(JSON.stringify({ error: 'Room code and player ID are required' }), { status: 400 });
    }

    const roomCode = code.toUpperCase();
    
    const [room] = await db.select().from(rooms).where(eq(rooms.code, roomCode));

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    const [creator] = await db
      .select({ isCreator: players.isCreator })
      .from(players)
      .where(eq(players.id, playerId));
    
    if (!creator || creator.isCreator !== true) {
        return new Response(JSON.stringify({ error: 'Only the creator can start the game' }), { status: 403 });
    }

    const roomPlayers = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.roomId, room.id));
    
    if (roomPlayers.length !== 5) {
      return new Response(JSON.stringify({ error: 'Need exactly 5 players to start' }), { status: 400 });
    }

    const roles = ['Leader', 'Assassin', 'Assassin', 'Traitor', 'Guardian'];
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    await db.transaction(async (tx) => {
        await tx.update(rooms).set({ status: 'started' }).where(eq(rooms.id, room.id));
        
        for (let i = 0; i < 5; i++) {
            await tx.update(players).set({ role: roles[i] }).where(eq(players.id, roomPlayers[i].id));
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
