import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useCommittee } from '../committee/CommitteeContext';
import { countryFlag } from '../committee/flags';
import { formatTime, useLiveSeconds } from '../committee/useTimer';

export default function GSL() {
  const { state, actions, offsetMs, readOnly } = useCommittee();
  const { currentSpeaker, queue } = state.session.gsl;
  const gslTimer = state.session.timers.gsl;
  const timeLeft = useLiveSeconds(gslTimer, offsetMs);
  const initialTime = gslTimer.durationSec;
  const isActive = gslTimer.isRunning;
  const [newName, setNewName] = useState('');

  const addToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    actions.gslAddToQueue(newName);
    setNewName('');
  };

  const progress = initialTime > 0 ? Math.min(100, (timeLeft / initialTime) * 100) : 0;

  return (
    <div className="w-full h-full flex flex-col pt-24 sm:pt-32 px-6 sm:px-12 pb-12 z-20 relative">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px bg-[#EFF4FF]/20 flex-1" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#EFF4FF]/60">General Speakers List</span>
        <div className="h-px bg-[#EFF4FF]/20 flex-1" />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-12 overflow-hidden">

        {/* Left Column: The Active Pod (65%) */}
        <div className="lg:w-[65%] flex flex-col justify-center items-center relative border border-[#EFF4FF]/10 bg-[#010828]/40 p-12 backdrop-blur-sm">

          <div className="absolute top-6 left-6 flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#6FFF00] animate-pulse shadow-[0_0_8px_#6FFF00]' : 'bg-red-500'}`} />
             <span className="font-mono text-[10px] tracking-widest text-[#EFF4FF]/60 uppercase">Floor Status</span>
          </div>

          <div className="flex flex-col items-center gap-2 mt-4">
            <span className="font-mono text-[96px] tracking-wider text-[#6FFF00] leading-none drop-shadow-[0_0_20px_rgba(111,255,0,0.3)]">
              {formatTime(timeLeft)}
            </span>
            <div className="w-full h-2 bg-[#EFF4FF]/10 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-[#6FFF00] transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {!readOnly && (
            <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-40 hover:opacity-100 transition-opacity">
              <button onClick={() => actions.timer('gsl', 'setDuration', 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTime === 60 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>1:00</button>
              <button onClick={() => actions.timer('gsl', 'setDuration', 90)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTime === 90 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>1:30</button>
              <button onClick={() => actions.timer('gsl', 'setDuration', 120)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTime === 120 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>2:00</button>
              <div className="w-px h-4 bg-[#EFF4FF]/20 my-auto mx-2" />
              <button onClick={() => actions.timer('gsl', 'addTime', -15)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">-15s</button>
              <button onClick={() => actions.timer('gsl', 'addTime', 15)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">+15s</button>
            </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <span className="font-mono text-xs tracking-widest uppercase text-[#EFF4FF]/50 block mb-4">Recognized Delegate</span>
            <h2 className="font-grotesk text-5xl sm:text-6xl text-[#EFF4FF] uppercase tracking-wide">
              {countryFlag(currentSpeaker) ? `${countryFlag(currentSpeaker)} ` : ''}{currentSpeaker}
            </h2>
          </div>
        </div>

        {/* Right Column: The Queue Matrix (35%) */}
        <div className="lg:w-[35%] flex flex-col border border-[#EFF4FF]/10 bg-[#010828]/40 backdrop-blur-sm p-6 overflow-hidden">
          <h3 className="font-mono text-sm tracking-widest uppercase text-[#EFF4FF]/80 mb-6 border-b border-[#EFF4FF]/20 pb-4">Up Next</h3>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
            {queue.map((delegate, idx) => (
              <div
                key={delegate.id}
                className={`group relative flex items-center gap-6 p-4 border border-[#EFF4FF]/10 bg-[#010828]/60 ${idx === 0 ? 'bg-[#EFF4FF]/5 border-[#EFF4FF]/30' : ''}`}
              >
                {idx === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6FFF00]" />}
                <span className="font-mono text-xs text-[#EFF4FF]/40">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className={`font-mono text-lg font-bold tracking-widest uppercase ${idx === 0 ? 'text-[#6FFF00]' : 'text-[#EFF4FF]'}`}>
                  {countryFlag(delegate.name) ? `${countryFlag(delegate.name)} ` : ''}{delegate.name}
                </span>
                {!readOnly && (
                  <button
                    onClick={() => actions.gslRemoveFromQueue(delegate.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 text-[#EFF4FF]/40 hover:text-red-400 transition-all"
                    aria-label={`Remove ${delegate.name} from queue`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {queue.length === 0 && (
              <div className="text-center font-mono text-xs text-[#EFF4FF]/40 mt-10">QUEUE EMPTY</div>
            )}
          </div>

          {!readOnly && (
          <form onSubmit={addToQueue} className="mt-4 flex gap-2 border-t border-[#EFF4FF]/20 pt-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ADD TO QUEUE"
              className="flex-1 min-w-0 bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-3 py-2 font-mono text-[11px] tracking-widest uppercase text-[#EFF4FF]"
            />
            <button type="submit" className="px-3 border border-[#6FFF00]/40 text-[#6FFF00] hover:bg-[#6FFF00]/10 transition-colors" aria-label="Add to queue">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          )}
        </div>
      </div>

      {/* Controls: Static, flat bottom border layer */}
      {!readOnly && (
      <div className="mt-8 border-t border-[#EFF4FF]/20 pt-6 flex gap-4">
        <button
          onClick={() => actions.timer('gsl', isActive ? 'pause' : 'start')}
          className="flex-1 bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/20 text-[#EFF4FF] font-black uppercase py-4 px-6 tracking-widest text-xs transition-colors"
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => actions.timer('gsl', 'reset')}
          className="flex-1 bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase py-4 px-6 tracking-widest text-xs transition-colors"
        >
          Reset Time
        </button>
        <button
          onClick={() => actions.gslYield()}
          className="flex-1 bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase py-4 px-6 tracking-widest text-xs transition-colors"
        >
          Yield Time
        </button>
      </div>
      )}
    </div>
  );
}
