import React, { useState } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import { useCommittee } from '../committee/CommitteeContext';
import { countryFlag } from '../committee/flags';

export default function RollCall() {
  const { state, actions, readOnly } = useCommittee();
  const delegates = state.delegates;
  const [newName, setNewName] = useState('');

  const total = delegates.length;
  const present = delegates.filter(d => d.status === 'PRESENT' || d.status === 'PRESENT_VOTING').length;
  const presentVoting = delegates.filter(d => d.status === 'PRESENT_VOTING').length;

  const quorumThreshold = Math.ceil(total * 0.5);
  const hasQuorum = present >= quorumThreshold;

  const addDelegate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    actions.addDelegate(newName);
    setNewName('');
  };

  return (
    <div className="w-full h-full flex flex-col pt-24 sm:pt-32 px-6 sm:px-12 pb-12 z-20 relative">

      {/* Projector Feature: Quorum Metric Indicator */}
      <div className="absolute top-24 right-12 z-30">
        <div className={`border ${hasQuorum ? 'border-[#6FFF00] bg-[#6FFF00]/10 text-[#6FFF00] shadow-[0_0_15px_rgba(111,255,0,0.5)]' : 'border-[#EFF4FF]/20 text-[#EFF4FF]/60'} px-6 py-3 flex items-center gap-4 transition-all duration-500`}>
          <div className={`w-3 h-3 rounded-full ${hasQuorum ? 'bg-[#6FFF00] animate-pulse' : 'bg-[#EFF4FF]/40'}`} />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest">Assembly Quorum</span>
            <span className="font-grotesk text-xl uppercase tracking-wider">{hasQuorum ? 'Threshold Met' : 'Establishing...'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-8 mt-12 overflow-hidden">

        {/* Left Column: Quick Stats Matrix */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 border border-[#EFF4FF]/20 bg-[#010828]/60 backdrop-blur-md p-6 flex flex-col justify-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EFF4FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#EFF4FF]/60 mb-2">Total Delegates</span>
            <span className="font-grotesk text-[5rem] leading-none tracking-tighter text-[#EFF4FF]">{total}</span>
          </div>

          <div className="flex-1 border border-[#EFF4FF]/20 bg-[#010828]/60 backdrop-blur-md p-6 flex flex-col justify-center shadow-lg relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-[#EFF4FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#EFF4FF]/60 mb-2">Present</span>
            <span className="font-grotesk text-[5rem] leading-none tracking-tighter text-[#EFF4FF]">{present}</span>
          </div>

          <div className="flex-1 border border-[#6FFF00]/40 bg-[#010828]/60 backdrop-blur-md p-6 flex flex-col justify-center shadow-lg relative overflow-hidden shadow-[0_0_20px_rgba(111,255,0,0.1)]">
            <span className="font-mono text-xs uppercase tracking-widest text-[#6FFF00] mb-2">Present & Voting</span>
            <span className="font-grotesk text-[5rem] leading-none tracking-tighter text-[#6FFF00]">{presentVoting}</span>
          </div>

          {/* Chair controls: add delegate / reset attendance */}
          {!readOnly && (
          <form onSubmit={addDelegate} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ADD DELEGATE"
              className="flex-1 min-w-0 bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-3 py-2 font-mono text-[11px] tracking-widest uppercase text-[#EFF4FF]"
            />
            <button type="submit" className="px-3 border border-[#6FFF00]/40 text-[#6FFF00] hover:bg-[#6FFF00]/10 transition-colors" aria-label="Add delegate">
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => actions.resetAttendance()}
              className="px-3 border border-[#EFF4FF]/20 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10 transition-colors"
              aria-label="Reset attendance"
              title="Reset all to absent"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </form>
          )}
        </div>

        {/* Right Column: Country Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-12 content-start">
          {delegates.map(delegate => (
            <button
              key={delegate.id}
              onClick={readOnly ? undefined : () => actions.cycleDelegate(delegate.id)}
              className={`group p-3 sm:p-4 text-left transition-all duration-300 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase flex flex-col gap-2 relative overflow-hidden ${readOnly ? 'cursor-default' : ''} ${
                delegate.status === 'ABSENT'
                  ? 'border border-[#EFF4FF]/10 text-[#EFF4FF]/40 hover:border-[#EFF4FF]/30'
                  : delegate.status === 'PRESENT'
                  ? 'border border-[#EFF4FF] text-[#EFF4FF] bg-[#EFF4FF]/5 shadow-[0_0_10px_rgba(239,244,255,0.1)]'
                  : 'border border-[#6FFF00] text-[#010828] bg-[#6FFF00] shadow-[0_0_15px_rgba(111,255,0,0.4)]'
              }`}
            >
              {!readOnly && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.removeDelegate(delegate.id);
                  }}
                  className={`absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity ${delegate.status === 'PRESENT_VOTING' ? 'text-[#010828]/60 hover:text-[#010828]' : 'text-[#EFF4FF]/40 hover:text-red-400'}`}
                  aria-label={`Remove ${delegate.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="z-10">{countryFlag(delegate.name) ? `${countryFlag(delegate.name)} ` : ''}{delegate.name}</span>
              <span className={`text-[9px] z-10 ${delegate.status === 'PRESENT_VOTING' ? 'text-[#010828]/70' : 'text-[#EFF4FF]/40'}`}>
                {delegate.status.replace('_', ' ')}
              </span>
              {delegate.status === 'PRESENT_VOTING' && (
                <div className="absolute inset-0 bg-white/20 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
