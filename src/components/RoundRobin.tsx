import React from 'react';
import { useCommittee } from '../committee/CommitteeContext';
import { countryFlag } from '../committee/flags';
import { useLiveSeconds } from '../committee/useTimer';

export default function RoundRobin() {
  const { state, actions, offsetMs, readOnly } = useCommittee();
  const { activeIndex, roster } = state.session.roundRobin;
  const rrTimer = state.session.timers.roundRobin;
  const timeLeft = useLiveSeconds(rrTimer, offsetMs);
  const duration = rrTimer.durationSec;
  const isActive = rrTimer.isRunning;

  const circumference = 2 * Math.PI * 45; // r=45
  const pct = duration > 0 ? Math.min(1, timeLeft / duration) : 0;
  const strokeDashoffset = circumference - pct * circumference;

  return (
    <div className="w-full h-full flex flex-col pt-32 px-6 sm:px-12 pb-12 z-20 relative overflow-hidden">

      {/* Timer Configuration */}
      {!readOnly && (
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-2 opacity-40 hover:opacity-100 transition-opacity z-30">
        <button onClick={() => actions.timer('roundRobin', 'setDuration', 30)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${duration === 30 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>30s</button>
        <button onClick={() => actions.timer('roundRobin', 'setDuration', 45)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${duration === 45 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>45s</button>
        <button onClick={() => actions.timer('roundRobin', 'setDuration', 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${duration === 60 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>60s</button>
        <div className="w-px h-4 bg-[#EFF4FF]/20 my-auto mx-1" />
        <button onClick={() => actions.timer('roundRobin', 'addTime', -10)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">-10s</button>
        <button onClick={() => actions.timer('roundRobin', 'addTime', 10)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">+10s</button>
      </div>
      )}

      {/* Timer: Central dedicated progress ring */}
      <div className="flex justify-center items-center mb-16 mt-8 relative">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="64" cy="64" r="45"
              fill="transparent"
              stroke="rgba(239, 244, 255, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="64" cy="64" r="45"
              fill="transparent"
              stroke="#6FFF00"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="font-mono text-3xl font-bold tracking-widest text-[#6FFF00] drop-shadow-[0_0_10px_rgba(111,255,0,0.5)]">
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Horizontal Strip Timeline Layout */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-4 overflow-x-visible w-full max-w-6xl mx-auto justify-center px-10">

          {roster.map((delegate, idx) => {
            const distance = Math.abs(idx - activeIndex);
            const isActiveNode = idx === activeIndex;

            // Layout scale calculations based on distance from center
            let scale = 'scale-75 opacity-40';
            if (isActiveNode) scale = 'scale-125 opacity-100 z-10 mx-8';
            else if (distance === 1) scale = 'scale-90 opacity-70';
            else if (distance > 2) scale = 'hidden';

            return (
              <div
                key={delegate}
                className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col items-center justify-center p-6 border transform ${scale} ${
                  isActiveNode
                    ? 'border-[#6FFF00] border-2 bg-[#010828] shadow-[0_0_30px_rgba(111,255,0,0.2)]'
                    : 'border-[#EFF4FF]/20 bg-[#010828]/60 backdrop-blur-sm'
                }`}
                style={{ width: '200px', height: '140px' }}
              >
                {isActiveNode && (
                  <span className="absolute top-2 font-mono text-[9px] text-[#6FFF00] uppercase tracking-widest">Active Floor</span>
                )}
                <span className={`font-mono font-bold tracking-widest uppercase text-center ${isActiveNode ? 'text-xl text-[#EFF4FF]' : 'text-sm text-[#EFF4FF]/80'}`}>
                  {countryFlag(delegate) ? `${countryFlag(delegate)} ` : ''}{delegate}
                </span>

                {/* Flat bar tracking downward on active node */}
                {isActiveNode && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EFF4FF]/10 overflow-hidden">
                    <div
                      className="h-full bg-[#6FFF00] transition-all duration-1000 ease-linear"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Flat controls */}
      {!readOnly && (
      <div className="mt-auto border-t border-[#EFF4FF]/20 pt-6 flex justify-center gap-4 max-w-md mx-auto w-full">
        <button
          onClick={() => actions.roundRobinPrev()}
          className="bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase p-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <button
          onClick={() => actions.timer('roundRobin', isActive ? 'pause' : 'start')}
          className="flex-1 bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/20 text-[#EFF4FF] font-black uppercase py-4 px-6 tracking-widest text-xs transition-colors text-center"
        >
          {isActive ? 'Pause' : 'Start Timer'}
        </button>
        <button
          onClick={() => actions.roundRobinNext()}
          className="bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase p-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
      )}
    </div>
  );
}
