import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function GameLobbyGrid() {
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState<"host" | "join" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get("join");
      if (joinCode) {
        setRoomCode(joinCode.toUpperCase());
        setTimeout(() => {
          document
            .getElementById("join-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading("host");
    setError("");

    try {
      const res = await fetch("/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: hostName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      sessionStorage.setItem("treachery_player_id", data.playerId);
      sessionStorage.setItem("treachery_player_name", hostName.trim());

      window.location.href = `/room/${data.code}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setLoading("join");
    setError("");

    try {
      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: joinName.trim(),
          code: roomCode.toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      sessionStorage.setItem("treachery_player_id", data.playerId);
      sessionStorage.setItem("treachery_player_name", joinName.trim());

      window.location.href = `/room/${data.code}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <>
      {error && (
        <div className="mx-auto mb-8 max-w-md rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center font-medium text-red-500">
          {error}
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Host Game Section */}
        <div className="group relative">
          <div className="from-primary absolute -inset-0.5 rounded-xl bg-gradient-to-br to-blue-600 opacity-10 blur transition duration-500 group-hover:opacity-30"></div>
          <div className="dark:border-primary/20 relative flex h-full flex-col overflow-hidden rounded-xl border border-white/20 bg-white/40 p-8 shadow-2xl backdrop-blur-xl dark:bg-slate-900/40">
            <div className="bg-primary/10 absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full blur-3xl"></div>
            <div className="relative z-10 mb-6 flex items-center gap-4">
              <div className="bg-primary rounded-lg p-3 text-white">
                <span className="material-symbols-outlined text-3xl">
                  crown
                </span>
              </div>
              <h2 className="text-2xl font-bold">Host a New Game</h2>
            </div>
            <p className="relative z-10 mb-8 text-slate-600 dark:text-slate-400">
              Ready to lead? Create a lobby and invite your friends. As the
              Monarch, you&apos;ll control the setup.
            </p>
            <form
              onSubmit={handleCreate}
              className="relative z-10 mt-auto space-y-6"
            >
              <div>
                <label
                  className="mb-2 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="host-name"
                >
                  Your Name
                </label>
                <input
                  className="focus:ring-primary w-full rounded-lg border border-slate-300 bg-white/50 px-4 py-3 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
                  id="host-name"
                  placeholder="The Praetor"
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  disabled={loading !== null}
                  maxLength={20}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading !== null}
                className="bg-primary hover:bg-primary/90 shadow-primary/20 group flex w-full transform items-center justify-center gap-2 rounded-lg px-6 py-4 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:hover:translate-y-0"
              >
                {loading === "host" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Initialize Lobby</span>
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
                      rocket_launch
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Join Game Section */}
        <div className="group relative" id="join-section">
          <div className="from-primary absolute -inset-0.5 rounded-xl bg-gradient-to-br to-indigo-600 opacity-10 blur transition duration-500 group-hover:opacity-30"></div>
          <div className="dark:border-primary/20 relative flex h-full flex-col overflow-hidden rounded-xl border border-white/20 bg-white/40 p-8 shadow-2xl backdrop-blur-xl dark:bg-slate-900/40">
            <div className="bg-primary/10 absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full blur-3xl"></div>
            <div className="relative z-10 mb-6 flex items-center gap-4">
              <div className="bg-primary/20 text-primary rounded-lg p-3">
                <span className="material-symbols-outlined text-3xl">
                  group_add
                </span>
              </div>
              <h2 className="text-2xl font-bold">Join Existing Game</h2>
            </div>
            <p className="relative z-10 mb-8 text-slate-600 dark:text-slate-400">
              Received a summons? Enter the secret room code below to join your
              fellow conspirators.
            </p>
            <form
              onSubmit={handleJoin}
              className="relative z-10 mt-auto space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="join-name"
                  >
                    Your Name
                  </label>
                  <input
                    className="focus:ring-primary w-full rounded-lg border border-slate-300 bg-white/50 px-4 py-3 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
                    id="join-name"
                    placeholder="Spy Master"
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    disabled={loading !== null}
                    maxLength={20}
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-2 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="room-code"
                  >
                    Room Code
                  </label>
                  <input
                    className="focus:ring-primary w-full rounded-lg border border-slate-300 bg-white/50 px-4 py-3 uppercase transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
                    id="room-code"
                    placeholder="TX-452"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    disabled={loading !== null}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading !== null}
                className="group flex w-full transform items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-4 font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:opacity-75 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {loading === "join" ? (
                  <Loader2 className="h-5 w-5 animate-spin dark:text-slate-900" />
                ) : (
                  <>
                    <span>Join the Table</span>
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
                      login
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
