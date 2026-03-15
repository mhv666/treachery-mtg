import React from 'react';
import GameLobbyGrid from './GameLobbyGrid';

export default function HomeForms() {
  return (
    <div className="w-full max-w-5xl mx-auto pt-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-br from-violet-400 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
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
