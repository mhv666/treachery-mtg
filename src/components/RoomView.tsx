import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Users, Play, Crown, Shield, Skull } from "lucide-react";
import QRCode from "qrcode";
import CountdownView from "./CountdownView";
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  roleIcons,
  roleColors,
  roleDescriptions,
  type Role,
} from "../lib/game";

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

export default function RoomView({ roomCode }: { roomCode: string }) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?join=${roomCode}`
      : "";

  useEffect(() => {
    const id = sessionStorage.getItem("treachery_player_id");
    const name = sessionStorage.getItem("treachery_player_name");
    if (!id || !name) {
      window.location.href = `/?join=${roomCode}`;
      return;
    }
    setPlayerId(id);
    setPlayerName(name);

    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
        margin: 1,
        width: 200,
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
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
        console.error("Error parsing room SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error", err);
    };

    return () => {
      eventSource.close();
    };
  }, [roomCode, playerId]);

  const handleStartGame = async () => {
    try {
      const res = await fetch("/api/start-countdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode, playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Card className="glass border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!roomState || !playerId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground mt-4 animate-pulse">
          Connecting to room...
        </p>
      </div>
    );
  }

  const currentPlayer = roomState.players.find((p) => p.id === playerId);
  const isCreator = currentPlayer?.isCreator;
  const playerCount = roomState.players.length;
  const canStart = playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS;
  const isCountdown = roomState.gamePhase === "countdown";
  const isStarted =
    roomState.status === "started" || roomState.gamePhase === "started";

  if (isCountdown) {
    return (
      <CountdownView
        roomCode={roomCode}
        roomState={roomState}
        playerId={playerId}
      />
    );
  }

  if (isStarted && currentPlayer?.role) {
    const role = currentPlayer.role as Role;
    const card = currentPlayer.card;

    return (
      <div className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center px-4">
        <Card className="glass relative w-full overflow-hidden border-white/20">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>
          <CardHeader className="pt-10 text-center">
            <div className="flex flex-col items-center justify-center">
              {roleIcons[role] && (
                <span className="mb-2 text-5xl">{roleIcons[role]}</span>
              )}
              <CardTitle className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-black tracking-widest text-transparent uppercase">
                {role}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-10 text-center">
            <p className="text-muted-foreground px-4 text-lg leading-relaxed">
              {roleDescriptions[role]}
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
          <CardFooter className="border-t border-white/5 bg-black/20 py-3">
            <p className="text-muted-foreground w-full text-center text-xs tracking-widest uppercase">
              Keep this role secret
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-5">
          <Card className="glass border-primary/30 relative overflow-hidden backdrop-blur-md">
            <div className="bg-primary/20 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-3xl"></div>
            <CardHeader>
              <CardDescription className="text-primary/80 text-xs font-medium tracking-wider uppercase">
                Room Code
              </CardDescription>
              <CardTitle className="text-6xl font-black tracking-widest">
                {roomCode}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qrCodeUrl ? (
                <div className="mt-2 inline-block rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
                  <img
                    src={qrCodeUrl}
                    alt="Join QR Code"
                    className="h-40 w-40 opacity-90 mix-blend-screen"
                  />
                </div>
              ) : (
                <div className="mt-2 h-40 w-40 animate-pulse rounded-xl bg-white/5"></div>
              )}
              <p className="text-muted-foreground mt-4 text-sm">
                Scan to join or enter the code on the homepage.
              </p>
            </CardContent>
          </Card>

          {isCreator && (
            <Button
              size="lg"
              className="shadow-primary/20 h-14 w-full text-lg font-bold shadow-xl"
              disabled={!canStart}
              onClick={handleStartGame}
            >
              <Play className="mr-2 h-5 w-5" fill="currentColor" />
              {canStart
                ? "Start Game"
                : `Waiting (${playerCount}/${MIN_PLAYERS})`}
            </Button>
          )}

          {!isCreator && (
            <Card className="glass border-white/5">
              <CardContent className="p-6 text-center">
                <Loader2 className="text-primary mx-auto mb-3 h-6 w-6 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Waiting for the creator to start the game...
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-7">
          <Card className="glass h-full border-white/10 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <Users className="mr-3 h-5 w-5 text-indigo-400" />
                  Joined Players
                </CardTitle>
                <span className="bg-primary/20 rounded-full px-3 py-1 text-xs font-bold tracking-wider text-indigo-300 uppercase">
                  {playerCount} / {MAX_PLAYERS}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roomState.players.map((p, idx) => (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-4 transition-all ${p.id === playerId ? "ring-primary/50 bg-primary/10 ring-1" : ""}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-lg font-bold text-indigo-300">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {p.name}{" "}
                          {p.id === playerId && (
                            <span className="ml-2 text-xs font-normal text-indigo-400">
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {p.isCreator && (
                      <div className="rounded border border-amber-500/20 bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
                        Host
                      </div>
                    )}
                  </li>
                ))}

                {Array.from({
                  length: Math.max(0, MIN_PLAYERS - playerCount),
                }).map((_, i) => (
                  <li
                    key={`empty-${i}`}
                    className="flex items-center space-x-4 rounded-lg border border-dashed border-white/10 bg-black/10 p-4 opacity-50"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/20"></div>
                    <p className="text-muted-foreground font-medium italic">
                      Waiting for player...
                    </p>
                  </li>
                ))}
              </ul>
              {playerCount > MIN_PLAYERS && (
                <p className="text-muted-foreground mt-4 text-center text-xs">
                  {playerCount} players in game. Roles will be assigned based on
                  player count.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
