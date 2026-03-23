import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { roleIcons, roleDescriptions, type Role } from '../lib/game';

interface CardData {
  id: number;
  name: string;
  uri: string;
  subtype: string | null;
  type: string;
  text: string;
  flavor: string;
  artist: string;
  rarity: string;
  cost: string;
  color: string;
}

interface Player {
  id: string;
  name: string;
  isCreator: boolean;
  role?: string;
  card: CardData | null;
}

interface RoomState {
  status: string;
  gamePhase: string;
  players: Player[];
}

interface CountdownViewProps {
  roomCode: string;
  roomState: RoomState;
  playerId: string;
}

export default function CountdownView({ roomCode, roomState, playerId }: CountdownViewProps) {
  const [countdown, setCountdown] = useState(3);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  const [isRevealing, setIsRevealing] = useState(false);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  
  const players = roomState.players;
  const totalPlayers = players.length;

  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown > 0) return;
    if (isRevealing) return;
    
    setIsRevealing(true);
    setCurrentPlayerIndex(0);
  }, [countdown, isRevealing]);

  useEffect(() => {
    if (!isRevealing) return;
    if (currentPlayerIndex >= totalPlayers) return;

    const timer = setTimeout(() => {
      setRevealedPlayers(prev => new Set([...prev, players[currentPlayerIndex].id]));
      setCurrentPlayerIndex(prev => prev + 1);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [isRevealing, currentPlayerIndex, totalPlayers, players]);

  useEffect(() => {
    if (!isRevealing) return;
    if (currentPlayerIndex < totalPlayers) return;
    if (showRoleReveal) return;

    const timer = setTimeout(() => {
      setShowRoleReveal(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isRevealing, currentPlayerIndex, totalPlayers, showRoleReveal]);

  const handleRevealComplete = useCallback(async () => {
    try {
      await fetch('/api/reveal-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode, playerId })
      });
    } catch (err) {
      console.error('Error revealing role:', err);
    }
  }, [roomCode, playerId]);

  useEffect(() => {
    if (!showRoleReveal) return;

    const timer = setTimeout(() => {
      handleRevealComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [showRoleReveal, handleRevealComplete]);

  if (showRoleReveal) {
    const currentPlayer = players.find(p => p.id === playerId);
    const role = currentPlayer?.role as Role | undefined;
    const card = currentPlayer?.card;

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto px-4">
        <Card className="glass border-white/20 w-full overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>
          <div className="p-6 pb-2 text-center pt-10">
            <div className="flex justify-center flex-col items-center">
              <span className="text-6xl mb-4 animate-bounce">
                {role && roleIcons[role]}
              </span>
              <h2 className="text-4xl uppercase tracking-widest font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                {role || 'Unknown'}
              </h2>
            </div>
          </div>
          <CardContent className="text-center pt-6 pb-10">
            <p className="text-lg text-muted-foreground leading-relaxed px-4">
              {role && roleDescriptions[role]}
            </p>
            {card && (
              <div className="mt-6">
                <img 
                  src={card.uri} 
                  alt={card.name}
                  className="w-48 h-64 object-cover rounded-lg mx-auto shadow-2xl"
                />
                <p className="text-sm text-muted-foreground mt-2">{card.name}</p>
                <p className="text-xs text-muted-foreground mt-2 italic px-4">{card.text}</p>
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-2 bg-black/20 border-t border-white/5 py-3">
            <p className="text-xs text-center w-full text-muted-foreground uppercase tracking-widest">
              Keep your identity secret
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4">
      <div className="relative w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl"></div>
        
        <div className="relative text-center mb-12">
          {countdown > 0 ? (
            <>
              <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-fuchsia-400 to-indigo-400 animate-pulse">
                {countdown}
              </div>
              <p className="text-xl text-muted-foreground mt-4 tracking-widest uppercase">
                Preparing identities...
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl font-bold text-white mb-2">
                Revealing Identities
              </div>
              <p className="text-lg text-muted-foreground tracking-widest uppercase">
                Your role is being dealt...
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {players.map((player, index) => {
            const isCurrentDealing = isRevealing && index === currentPlayerIndex - 1;
            const isRevealed = revealedPlayers.has(player.id);
            const isMe = player.id === playerId;

            return (
              <div
                key={player.id}
                className={`
                  relative transition-all duration-500
                  ${isCurrentDealing ? 'scale-110 z-10' : 'scale-100'}
                  ${isMe ? 'ring-2 ring-primary' : ''}
                `}
              >
                <Card className={`
                  glass overflow-hidden transition-all duration-500
                  ${isRevealed ? 'border-white/30' : 'border-white/10'}
                  ${isCurrentDealing ? 'shadow-2xl shadow-violet-500/30' : ''}
                `}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold
                        ${isMe ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {player.name}
                          {isMe && <span className="text-xs ml-2 text-primary">(You)</span>}
                        </p>
                      </div>
                    </div>

                    <div className={`
                      relative h-48 rounded-lg overflow-hidden bg-black/30
                      transition-all duration-500
                      ${isRevealed ? 'animate-cardReveal' : ''}
                    `}>
                      {!isRevealed ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-xl flex items-center justify-center">
                            <div className="text-2xl font-black text-white/30">?</div>
                          </div>
                          {isCurrentDealing && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-full bg-gradient-to-t from-violet-500/30 to-transparent animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img 
                            src={player.card?.uri} 
                            alt={player.card?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {isRevealed && (
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        {roleIcons[player.role as Role]} {player.role}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPlayers }).map((_, i) => (
            <div
              key={i}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${revealedPlayers.has(players[i]?.id) 
                  ? 'bg-primary scale-110' 
                  : i === currentPlayerIndex 
                    ? 'bg-violet-400 animate-ping' 
                    : 'bg-white/20'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
