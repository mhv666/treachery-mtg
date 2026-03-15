import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Users, Play, Crown, Shield, Skull } from 'lucide-react';
import QRCode from 'qrcode';

interface Player {
  id: string;
  name: string;
  isCreator: boolean;
  role?: string;
}

interface RoomState {
  status: string;
  players: Player[];
}

export default function RoomView({ roomCode }: { roomCode: string }) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Actually, we can get the join URL by appending the code
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/?join=${roomCode}` : '';

  useEffect(() => {
    const id = sessionStorage.getItem('treachery_player_id');
    const name = sessionStorage.getItem('treachery_player_name');
    if (!id || !name) {
      window.location.href = `/?join=${roomCode}`;
      return;
    }
    setPlayerId(id);
    setPlayerName(name);

    // Generate QR code
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        color: {
          dark: '#ffffff',
          light: '#00000000' // transparent background
        },
        margin: 1,
        width: 200
      }).then(url => setQrCodeUrl(url)).catch(err => console.error(err));
    }
  }, [roomCode, joinUrl]);

  useEffect(() => {
    if (!playerId) return;

    const eventSource = new EventSource(`/api/room/${roomCode}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
        } else {
          setRoomState(data);
        }
      } catch (err) {
        console.error('Error parsing room SSE data', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error', err);
      // Wait for auto-reconnect, but if needed we can handle connection drops here.
    };

    return () => {
      eventSource.close();
    };
  }, [roomCode, playerId]);

  const handleStartGame = async () => {
    try {
      const res = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode, playerId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err: any) {
        alert(err.message);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="glass border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = '/'} variant="outline">Back to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!roomState || !playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Connecting to room...</p>
      </div>
    );
  }

  const currentPlayer = roomState.players.find(p => p.id === playerId);
  const isCreator = currentPlayer?.isCreator;
  const isStarted = roomState.status === 'started';

  const roleIcons: Record<string, React.ReactNode> = {
    'Leader': <Crown className="h-12 w-12 text-yellow-500 mb-4" />,
    'Guardian': <Shield className="h-12 w-12 text-blue-500 mb-4" />,
    'Assassin': <span className="text-5xl mb-4 leading-none">🗡️</span>,
    'Traitor': <Skull className="h-12 w-12 text-zinc-400 mb-4" />
  };

  const roleDescriptions: Record<string, string> = {
    'Leader': 'You must discover and eliminate the Assassins and the Traitor. Survive at all costs. You begin the game revealed.',
    'Guardian': 'Your objective is to protect the Leader at all costs. You win if the Leader wins.',
    'Assassin': 'Your objective is to kill the Leader. You win if the Leader dies.',
    'Traitor': 'Your objective is to be the last player standing. Eliminate the Assassins and the Guardian first, then kill the Leader.'
  };

  if (isStarted && currentPlayer?.role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto px-4">
        <Card className="glass border-white/20 w-full overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>
          <CardHeader className="text-center pt-10">
            <div className="flex justify-center flex-col items-center">
                {roleIcons[currentPlayer.role] || <Users className="h-12 w-12 text-primary mb-4" />}
                <CardTitle className="text-4xl uppercase tracking-widest font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                  {currentPlayer.role}
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center pt-6 pb-10">
            <p className="text-lg text-muted-foreground leading-relaxed px-4">
              {roleDescriptions[currentPlayer.role]}
            </p>
          </CardContent>
          <CardFooter className="bg-black/20 border-t border-white/5 py-3">
            <p className="text-xs text-center w-full text-muted-foreground uppercase tracking-widest">
              Keep this role secret
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Waiting Room View
  return (
    <div className="w-full max-w-3xl mx-auto pt-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Room Info */}
        <div className="md:col-span-5 space-y-6">
            <Card className="glass border-primary/30 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <CardHeader>
                <CardDescription className="text-primary/80 font-medium uppercase tracking-wider text-xs">Room Code</CardDescription>
                <CardTitle className="text-6xl font-black tracking-widest">{roomCode}</CardTitle>
              </CardHeader>
              <CardContent>
                {qrCodeUrl ? (
                  <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl inline-block border border-white/10 mt-2">
                    <img src={qrCodeUrl} alt="Join QR Code" className="w-40 h-40 mix-blend-screen opacity-90" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-white/5 animate-pulse rounded-xl mt-2"></div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Scan to join or enter the code on the homepage.
                </p>
              </CardContent>
            </Card>

            {isCreator && (
              <Button 
                size="lg"
                className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20"
                disabled={roomState.players.length !== 5}
                onClick={handleStartGame}
              >
                <Play className="mr-2 h-5 w-5" fill="currentColor" />
                {roomState.players.length === 5 ? 'Start Game' : `Waiting (${roomState.players.length}/5)`}
              </Button>
            )}
            
            {!isCreator && (
              <Card className="glass border-white/5">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Waiting for the creator to start the game...</p>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right Column: Players */}
        <div className="md:col-span-7">
          <Card className="glass shadow-xl h-full border-white/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-xl">
                  <Users className="mr-3 h-5 w-5 text-indigo-400" />
                  Joined Players
                </CardTitle>
                <span className="bg-primary/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {roomState.players.length} / 5
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roomState.players.map((p, idx) => (
                  <li key={p.id} className={`flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5 transition-all ${p.id === playerId ? 'ring-1 ring-primary/50 bg-primary/10' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 font-bold text-lg text-indigo-300">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">
                          {p.name} {p.id === playerId && <span className="text-xs ml-2 text-indigo-400 font-normal">(You)</span>}
                        </p>
                      </div>
                    </div>
                    {p.isCreator && (
                      <div className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded border border-amber-500/20 font-medium">
                        Host
                      </div>
                    )}
                  </li>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 5 - roomState.players.length }).map((_, i) => (
                  <li key={`empty-${i}`} className="flex items-center space-x-4 p-4 rounded-lg bg-black/10 border border-dashed border-white/10 opacity-50">
                     <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center"></div>
                     <p className="font-medium text-muted-foreground italic">Waiting for player...</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
