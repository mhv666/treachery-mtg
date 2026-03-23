import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function GameLobbyGrid() {
  const [hostName, setHostName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState<'host' | 'join' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('join');
      if (joinCode) {
        setRoomCode(joinCode.toUpperCase());
        setTimeout(() => {
          document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading('host');
    setError('');

    try {
      const res = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: hostName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      sessionStorage.setItem('treachery_player_id', data.playerId);
      sessionStorage.setItem('treachery_player_name', hostName.trim());

      window.location.href = `/room/${data.code}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading('join');
    setError('');

    try {
      const res = await fetch('/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: joinName.trim(), code: roomCode.toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      sessionStorage.setItem('treachery_player_id', data.playerId);
      sessionStorage.setItem('treachery_player_name', joinName.trim());

      window.location.href = `/room/${data.code}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <>
      {error && (
        <div className="max-w-md mx-auto mb-8 text-center bg-red-500/10 border border-red-500/20 text-red-500 font-medium py-3 px-4 rounded-lg">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Host Game Section */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-blue-600 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-primary/20 rounded-xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="mb-6 flex items-center gap-4 relative z-10">
              <div className="p-3 bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined text-3xl">crown</span>
              </div>
              <h2 className="text-2xl font-bold">Host a New Game</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10">
              Ready to lead? Create a lobby and invite your friends. As the Monarch, you&apos;ll control the setup.
            </p>
            <form onSubmit={handleCreate} className="space-y-6 mt-auto relative z-10">
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-slate-700 dark:text-slate-300" htmlFor="host-name">Your Name</label>
                <input 
                  className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
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
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-75 disabled:hover:translate-y-0"
              >
                {loading === 'host' ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>Initialize Lobby</span>
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">rocket_launch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Join Game Section */}
        <div className="group relative" id="join-section">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-primary/20 rounded-xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="mb-6 flex items-center gap-4 relative z-10">
              <div className="p-3 bg-primary/20 text-primary rounded-lg">
                <span className="material-symbols-outlined text-3xl">group_add</span>
              </div>
              <h2 className="text-2xl font-bold">Join Existing Game</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10">
              Received a summons? Enter the secret room code below to join your fellow conspirators.
            </p>
            <form onSubmit={handleJoin} className="space-y-6 mt-auto relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-slate-700 dark:text-slate-300" htmlFor="join-name">Your Name</label>
                  <input 
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
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
                  <label className="block text-sm font-semibold mb-2 ml-1 text-slate-700 dark:text-slate-300" htmlFor="room-code">Room Code</label>
                  <input 
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all uppercase placeholder:text-slate-400" 
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
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 px-6 rounded-lg shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-75 disabled:hover:translate-y-0"
              >
                {loading === 'join' ? (
                  <Loader2 className="animate-spin h-5 w-5 dark:text-slate-900" />
                ) : (
                  <>
                    <span>Join the Table</span>
                    <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">login</span>
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
