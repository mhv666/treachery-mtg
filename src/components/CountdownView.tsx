import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { roleIcons, roleDescriptions, type Role } from "../lib/game";

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

export default function CountdownView({
  roomCode,
  roomState,
  playerId,
}: CountdownViewProps) {
  const [countdown, setCountdown] = useState(3);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(
    new Set(),
  );
  const [isRevealing, setIsRevealing] = useState(false);
  const [showRoleReveal, setShowRoleReveal] = useState(false);

  const players = roomState.players;
  const totalPlayers = players.length;

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
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
      setRevealedPlayers(
        (prev) => new Set([...prev, players[currentPlayerIndex].id]),
      );
      setCurrentPlayerIndex((prev) => prev + 1);
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
      await fetch("/api/reveal-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode, playerId }),
      });
    } catch (err) {
      console.error("Error revealing role:", err);
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
    const currentPlayer = players.find((p) => p.id === playerId);
    const role = currentPlayer?.role as Role | undefined;
    const card = currentPlayer?.card;

    return (
      <div className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center px-4">
        <Card className="glass relative w-full overflow-hidden border-white/20">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>
          <div className="p-6 pt-10 pb-2 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="mb-4 animate-bounce text-6xl">
                {role && roleIcons[role]}
              </span>
              <h2 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-black tracking-widest text-transparent uppercase">
                {role || "Unknown"}
              </h2>
            </div>
          </div>
          <CardContent className="pt-6 pb-10 text-center">
            <p className="text-muted-foreground px-4 text-lg leading-relaxed">
              {role && roleDescriptions[role]}
            </p>
            {card && (
              <div className="mt-6">
                <img
                  src={card.uri}
                  alt={card.name}
                  className="mx-auto h-64 w-48 rounded-lg object-cover shadow-2xl"
                />
                <p className="text-muted-foreground mt-2 text-sm">
                  {card.name}
                </p>
                <p className="text-muted-foreground mt-2 px-4 text-xs italic">
                  {card.text}
                </p>
              </div>
            )}
          </CardContent>
          <div className="border-t border-white/5 bg-black/20 p-6 py-3 pt-2">
            <p className="text-muted-foreground w-full text-center text-xs tracking-widest uppercase">
              Keep your identity secret
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center px-4">
      <div className="relative w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl"></div>

        <div className="relative mb-12 text-center">
          {countdown > 0 ? (
            <>
              <div className="animate-pulse bg-gradient-to-br from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-9xl font-black text-transparent">
                {countdown}
              </div>
              <p className="text-muted-foreground mt-4 text-xl tracking-widest uppercase">
                Preparing identities...
              </p>
            </>
          ) : (
            <>
              <div className="mb-2 text-5xl font-bold text-white">
                Revealing Identities
              </div>
              <p className="text-muted-foreground text-lg tracking-widest uppercase">
                Your role is being dealt...
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {players.map((player, index) => {
            const isCurrentDealing =
              isRevealing && index === currentPlayerIndex - 1;
            const isRevealed = revealedPlayers.has(player.id);
            const isMe = player.id === playerId;

            return (
              <div
                key={player.id}
                className={`relative transition-all duration-500 ${isCurrentDealing ? "z-10 scale-110" : "scale-100"} ${isMe ? "ring-primary ring-2" : ""} `}
              >
                <Card
                  className={`glass overflow-hidden transition-all duration-500 ${isRevealed ? "border-white/30" : "border-white/10"} ${isCurrentDealing ? "shadow-2xl shadow-violet-500/30" : ""} `}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${isMe ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"} `}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {player.name}
                          {isMe && (
                            <span className="text-primary ml-2 text-xs">
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative h-48 overflow-hidden rounded-lg bg-black/30 transition-all duration-500 ${isRevealed ? "animate-cardReveal" : ""} `}
                    >
                      {!isRevealed ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl">
                            <div className="text-2xl font-black text-white/30">
                              ?
                            </div>
                          </div>
                          {isCurrentDealing && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-full w-full animate-pulse bg-gradient-to-t from-violet-500/30 to-transparent"></div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            src={player.card?.uri}
                            alt={player.card?.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {isRevealed && (
                      <p className="text-muted-foreground mt-2 text-center text-xs">
                        {roleIcons[player.role as Role]} {player.role}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPlayers }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                revealedPlayers.has(players[i]?.id)
                  ? "bg-primary scale-110"
                  : i === currentPlayerIndex
                    ? "animate-ping bg-violet-400"
                    : "bg-white/20"
              } `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
