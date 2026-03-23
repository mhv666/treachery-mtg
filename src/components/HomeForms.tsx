import React from "react";
import GameLobbyGrid from "./GameLobbyGrid";

export default function HomeForms() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-16">
      <div className="mb-10 text-center">
        <h1 className="mb-3 bg-gradient-to-br from-violet-400 to-indigo-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm md:text-5xl">
          Treachery MTG
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Hidden Roles Multiplayer Game
        </p>
      </div>

      <GameLobbyGrid />
    </div>
  );
}
