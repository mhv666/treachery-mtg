import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Users, Swords, Loader2 } from 'lucide-react';

export default function HomeForms() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (mode === 'join' && !roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'create' ? '/api/create-room' : '/api/join-room';
      const body = mode === 'create' ? { playerName: name } : { playerName: name, code: roomCode };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save player info in session storage
      sessionStorage.setItem('treachery_player_id', data.playerId);
      sessionStorage.setItem('treachery_player_name', name);

      // Redirect to room
      window.location.href = `/room/${data.code}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-br from-violet-400 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
          Treachery MTG
        </h1>
        <p className="text-muted-foreground text-lg">
          Hidden Roles Multiplayer Game
        </p>
      </div>

      <Card className="glass border-white/10 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <div className="flex w-full mb-4 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'create' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'join' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-white'}`}
            >
              Join Room
            </button>
          </div>
          <CardTitle>{mode === 'create' ? 'Start a New Game' : 'Join an Existing Game'}</CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Create a room to invite 4 magical friends.'
              : 'Enter the 4-letter code to join.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">Your Name</label>
              <Input
                id="name"
                placeholder="e.g. Jace Beleren"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/20 border-white/10 focus-visible:ring-indigo-500"
                maxLength={20}
                required
              />
            </div>

            {mode === 'join' && (
              <div className="space-y-2">
                <label htmlFor="roomCode" className="text-sm font-medium leading-none">Room Code</label>
                <Input
                  id="roomCode"
                  placeholder="e.g. ABCD"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-black/20 border-white/10 uppercase tracking-widest focus-visible:ring-indigo-500"
                  maxLength={6}
                  required
                />
              </div>
            )}

            {error && <div className="text-destructive text-sm font-medium font-mono bg-destructive/10 p-2 rounded border border-destructive/20">{error}</div>}

            <Button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg hover:shadow-indigo-500/25">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === 'create' ? <Swords className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
              {mode === 'create' ? 'Create Room' : 'Join Room'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-12 text-center text-sm text-muted-foreground/60">
        <p>A 5-player hidden-roles experience.</p>
        <p>1 Leader • 2 Assassins • 1 Traitor • 1 Guardian</p>
      </div>
    </div>
  );
}
