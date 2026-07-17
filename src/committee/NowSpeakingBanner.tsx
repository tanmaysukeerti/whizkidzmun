import React from 'react';
import { Mic } from 'lucide-react';
import type { TimerKey, ViewState } from '../types';
import { useCommittee } from './CommitteeContext';
import { countryFlag } from './flags';
import { formatTime, useLiveSeconds } from './useTimer';

// Persistent "NOW SPEAKING" pill: whenever a speaker clock is running, every
// OTHER view shows who has the floor and their countdown, so navigating to
// Voting or Roll Call never loses the speaker. Hidden on the view that owns
// the running clock (it already displays the speaker large) and in crisis.

interface Floor {
  name: string;
  timerKey: TimerKey;
  ownerView: ViewState;
}

export default function NowSpeakingBanner() {
  const { state, offsetMs } = useCommittee();
  const { timers, gsl, caucus, roundRobin, activeView } = state.session;

  const floor: Floor | null = timers.gsl.isRunning
    ? { name: gsl.currentSpeaker, timerKey: 'gsl', ownerView: 'GSL' }
    : timers.caucusSpeaker.isRunning
      ? { name: caucus.queue[0] ?? 'THE FLOOR', timerKey: 'caucusSpeaker', ownerView: 'CAUCUS' }
      : timers.roundRobin.isRunning
        ? {
            name: roundRobin.roster[roundRobin.activeIndex] ?? 'THE FLOOR',
            timerKey: 'roundRobin',
            ownerView: 'ROUND_ROBIN',
          }
        : null;

  // Hooks must run unconditionally; fall back to any timer when idle.
  const timeLeft = useLiveSeconds(timers[floor?.timerKey ?? 'gsl'], offsetMs);

  if (!floor || activeView === floor.ownerView || activeView === 'CRISIS') return null;

  const flag = countryFlag(floor.name);
  const urgent = timeLeft <= 10;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div
        className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-lg transition-colors ${
          urgent
            ? 'border-red-500/60 bg-[#010828]/90 shadow-[0_0_20px_rgba(255,51,51,0.3)]'
            : 'border-[#6FFF00]/40 bg-[#010828]/90 shadow-[0_0_20px_rgba(111,255,0,0.15)]'
        }`}
      >
        <Mic className={`w-3.5 h-3.5 ${urgent ? 'text-red-500 animate-pulse' : 'text-[#6FFF00] animate-pulse'}`} />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#EFF4FF]/50">
          Now Speaking
        </span>
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#EFF4FF]">
          {flag ? `${flag} ` : ''}{floor.name}
        </span>
        <span className={`font-mono text-sm font-bold tracking-widest ${urgent ? 'text-red-500' : 'text-[#6FFF00]'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}
