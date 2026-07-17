import React, { useState } from 'react';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import BoomerangVideoBg from '../components/BoomerangVideoBg';
import { useAuth } from './AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(username, password);
    if (err) {
      setError(err);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#010828] text-[#EFF4FF] font-sans flex items-center justify-center px-4">
      <div className="grid-bg" />
      <div className="scanline" />
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(111,255,0,0.05)_0%,transparent_70%)]" />
      <BoomerangVideoBg
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4"
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
      />

      {/* Wordmark */}
      <div className="absolute top-6 left-6 flex items-center z-20">
        <span className="font-grotesk text-2xl tracking-tighter uppercase">WHIZKIDZ.MUN</span>
        <sup className="text-[10px] ml-0.5 mt-1">TM</sup>
      </div>

      <div className="absolute font-condiment text-[#6FFF00] opacity-60 rotate-[-15deg] text-[1.2rem] pointer-events-none z-20 top-28 left-10 md:left-[18%]">
        Classified Access
      </div>

      {/* Auth panel */}
      <form
        onSubmit={submit}
        className={`relative z-20 w-full max-w-md border border-[#EFF4FF]/20 bg-[#010828]/80 backdrop-blur-md p-8 sm:p-10 shadow-2xl transition-transform ${
          shake ? 'animate-pulse' : ''
        }`}
        style={shake ? { animation: 'none', transform: 'translateX(0)' } : undefined}
      >
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-4 h-4 text-[#6FFF00]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6FFF00]">
            Secure Terminal
          </span>
        </div>
        <h1 className="font-grotesk text-4xl uppercase tracking-tight leading-none mb-8">
          Dais Access
        </h1>

        <label className="block mb-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EFF4FF]/60 mb-2 block">
            Operator ID
          </span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-4 py-3 font-mono text-sm tracking-widest uppercase text-[#EFF4FF] transition-colors"
            placeholder="chair"
          />
        </label>

        <label className="block mb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EFF4FF]/60 mb-2 block">
            Access Key
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-4 py-3 font-mono text-sm tracking-widest text-[#EFF4FF] transition-colors"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 mb-6 border border-red-500/40 bg-red-900/20 px-4 py-3">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-red-400">
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/30 text-[#EFF4FF] font-black uppercase py-4 tracking-widest text-xs transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Authenticate
        </button>

        <p className="mt-6 font-mono text-[9px] uppercase tracking-widest text-[#EFF4FF]/30 text-center leading-relaxed">
          Unauthorized access is monitored · Session 44.B
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#6FFF00] font-bold text-center">
          Engineered by Tanmay Sukeerti M
        </p>
      </form>
    </div>
  );
}
