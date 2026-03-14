import type { APIRoute } from 'astro';
import db from '../../db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { code, playerId } = data;

    if (!code || !playerId) {
      return new Response(JSON.stringify({ error: 'Room code and player ID are required' }), { status: 400 });
    }

    const roomCode = code.toUpperCase();
    
    const room = db.prepare('SELECT id, status FROM rooms WHERE code = ?').get(roomCode) as { id: string, status: string } | undefined;

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    // Verify player is creator
    const creator = db.prepare('SELECT is_creator FROM players WHERE id = ? AND room_id = ?').get(playerId, room.id) as { is_creator: number } | undefined;
    
    if (!creator || creator.is_creator !== 1) {
        return new Response(JSON.stringify({ error: 'Only the creator can start the game' }), { status: 403 });
    }

    const playersResp = db.prepare('SELECT id FROM players WHERE room_id = ?').all(room.id) as {id: string}[];
    
    if (playersResp.length !== 5) {
      return new Response(JSON.stringify({ error: 'Need exactly 5 players to start' }), { status: 400 });
    }

    // Assign roles randomly
    const roles = ['Leader', 'Assassin', 'Assassin', 'Traitor', 'Guardian'];
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    db.transaction(() => {
        db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run('started', room.id);
        
        for (let i = 0; i < 5; i++) {
            db.prepare('UPDATE players SET role = ? WHERE id = ?').run(roles[i], playersResp[i].id);
        }
    })();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
