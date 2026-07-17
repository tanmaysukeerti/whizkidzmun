import React, { useState } from 'react';
import { Check, Pencil, Plus } from 'lucide-react';
import { useCommittee } from '../committee/CommitteeContext';
import { countryFlag } from '../committee/flags';
import { formatTime, useLiveSeconds } from '../committee/useTimer';

export default function Caucus() {
  const { state, actions, offsetMs, readOnly } = useCommittee();
  const { mode, topic, queue } = state.session.caucus;

  const totalTimer = state.session.timers.caucusTotal;
  const totalTimeLeft = useLiveSeconds(totalTimer, offsetMs);
  const initialTotalTime = totalTimer.durationSec;
  const isTotalActive = totalTimer.isRunning;

  const speakerTimer = state.session.timers.caucusSpeaker;
  const speakerTimeLeft = useLiveSeconds(speakerTimer, offsetMs);
  const initialSpeakerTime = speakerTimer.durationSec;
  const isSpeakerActive = speakerTimer.isRunning;

  const isWarning = mode === 'UNMODERATED' && totalTimeLeft < 60 && totalTimeLeft > 0;

  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState(topic);
  const [newSpeaker, setNewSpeaker] = useState('');

  const saveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    actions.caucusSetTopic(topicDraft);
    setEditingTopic(false);
  };

  const addSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeaker.trim()) return;
    actions.caucusAddToQueue(newSpeaker);
    setNewSpeaker('');
  };

  return (
    <div className="w-full h-full flex flex-col pt-24 sm:pt-32 px-6 sm:px-12 pb-12 z-20 relative">

      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#EFF4FF]/20 pb-4">
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[10px] text-[#6FFF00] tracking-widest uppercase mb-1">
            {mode === 'MODERATED' ? 'Moderated Caucus' : 'Unmoderated Caucus'}
          </span>
          {readOnly ? (
            <h2 className="font-grotesk text-2xl tracking-wide uppercase text-[#EFF4FF]">
              {topic}
            </h2>
          ) : editingTopic ? (
            <form onSubmit={saveTopic} className="flex items-center gap-2">
              <input
                autoFocus
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                className="bg-[#EFF4FF]/5 border border-[#6FFF00]/40 outline-none px-3 py-1.5 font-grotesk text-xl tracking-wide uppercase text-[#EFF4FF] w-full md:w-[36rem] max-w-full"
              />
              <button type="submit" className="p-2 border border-[#6FFF00]/40 text-[#6FFF00] hover:bg-[#6FFF00]/10" aria-label="Save topic">
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => { setTopicDraft(topic); setEditingTopic(true); }}
              className="group flex items-start gap-2 text-left"
              title="Edit topic"
            >
              <h2 className="font-grotesk text-2xl tracking-wide uppercase text-[#EFF4FF]">
                {topic}
              </h2>
              <Pencil className="w-3.5 h-3.5 mt-1 shrink-0 text-[#EFF4FF]/30 group-hover:text-[#6FFF00] transition-colors" />
            </button>
          )}
        </div>

        {readOnly ? (
          <div className="flex border border-[#EFF4FF]/20 bg-[#010828]/60 px-4 py-2 rounded-sm shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#6FFF00]">
            {mode === 'MODERATED' ? 'Moderated' : 'Unmoderated'}
          </div>
        ) : (
          <div className="flex border border-[#EFF4FF]/20 bg-[#010828]/60 p-1 rounded-sm shrink-0">
            <button
              onClick={() => actions.caucusSetMode('MODERATED')}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${mode === 'MODERATED' ? 'bg-[#EFF4FF]/20 text-[#EFF4FF]' : 'text-[#EFF4FF]/50 hover:text-[#EFF4FF]'}`}
            >
              Moderated
            </button>
            <button
              onClick={() => actions.caucusSetMode('UNMODERATED')}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${mode === 'UNMODERATED' ? 'bg-[#EFF4FF]/20 text-[#EFF4FF]' : 'text-[#EFF4FF]/50 hover:text-[#EFF4FF]'}`}
            >
              Unmoderated
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex w-full">
        {mode === 'MODERATED' ? (
          <div className="w-full flex flex-col lg:flex-row gap-8">

            {/* Left: Total Caucus Time */}
            <div className="lg:w-1/2 border border-[#EFF4FF]/10 bg-[#010828]/40 backdrop-blur-sm p-8 flex flex-col items-center justify-center">
              <span className="font-mono text-sm tracking-widest text-[#EFF4FF]/60 uppercase mb-6">Total Caucus Time</span>
              <span className="font-mono text-7xl lg:text-[120px] tracking-wider text-[#EFF4FF] leading-none drop-shadow-lg">
                {formatTime(totalTimeLeft)}
              </span>

              {!readOnly && (
              <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-40 hover:opacity-100 transition-opacity">
                <button onClick={() => actions.timer('caucusTotal', 'setDuration', 10 * 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTotalTime === 600 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>10m</button>
                <button onClick={() => actions.timer('caucusTotal', 'setDuration', 15 * 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTotalTime === 900 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>15m</button>
                <button onClick={() => actions.timer('caucusTotal', 'setDuration', 20 * 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTotalTime === 1200 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>20m</button>
                <div className="w-px h-4 bg-[#EFF4FF]/20 my-auto mx-1" />
                <button onClick={() => actions.timer('caucusTotal', 'addTime', -60)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">-1m</button>
                <button onClick={() => actions.timer('caucusTotal', 'addTime', 60)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">+1m</button>
              </div>
              )}

              {!readOnly && (
              <button
                onClick={() => actions.timer('caucusTotal', isTotalActive ? 'pause' : 'start')}
                className="mt-8 bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/30 text-[#EFF4FF] font-black uppercase py-3 px-8 tracking-widest text-xs transition-colors"
              >
                {isTotalActive ? 'PAUSE TOTAL TIME' : 'START TOTAL TIME'}
              </button>
              )}
            </div>

            {/* Right: Per-Speaker Timer & Queue */}
            <div className="lg:w-1/2 flex flex-col gap-8">
              <div className="flex-1 border border-[#6FFF00]/30 bg-[#010828]/40 backdrop-blur-sm p-8 flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(111,255,0,0.05)]">
                <span className="absolute top-4 left-6 font-mono text-[10px] tracking-widest text-[#6FFF00] uppercase">Active Delegate</span>

                <h3 className="font-grotesk text-3xl uppercase tracking-wider text-[#EFF4FF] mt-4 mb-2">
                  {queue[0] ? `${countryFlag(queue[0]) ? `${countryFlag(queue[0])} ` : ''}${queue[0]}` : 'NONE'}
                </h3>

                <span className="font-mono text-6xl tracking-wider text-[#6FFF00] leading-none drop-shadow-[0_0_10px_rgba(111,255,0,0.3)] my-4">
                  {speakerTimeLeft}s
                </span>

                {!readOnly && (
                <div className="flex gap-2 mt-2 mb-4 opacity-40 hover:opacity-100 transition-opacity">
                  <button onClick={() => actions.timer('caucusSpeaker', 'setDuration', 30)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialSpeakerTime === 30 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>30s</button>
                  <button onClick={() => actions.timer('caucusSpeaker', 'setDuration', 45)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialSpeakerTime === 45 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>45s</button>
                  <button onClick={() => actions.timer('caucusSpeaker', 'setDuration', 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialSpeakerTime === 60 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>60s</button>
                </div>
                )}

                {!readOnly && (
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => actions.timer('caucusSpeaker', isSpeakerActive ? 'pause' : 'start')}
                    className="bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/20 text-[#EFF4FF] font-black uppercase py-2 px-6 tracking-widest text-[10px] transition-colors"
                  >
                    {isSpeakerActive ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={() => actions.caucusNext()}
                    className="bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase py-2 px-6 tracking-widest text-[10px] transition-colors"
                  >
                    Next
                  </button>
                </div>
                )}
              </div>

              <div className="h-1/3 border border-[#EFF4FF]/10 bg-[#010828]/40 p-4 overflow-y-auto flex flex-col">
                <span className="font-mono text-[10px] tracking-widest text-[#EFF4FF]/60 uppercase mb-3 block">Speaker Queue</span>
                <div className="flex flex-wrap gap-2 flex-1 content-start">
                  {queue.slice(1).map((del, idx) => (
                    <div key={idx} className="bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-[#EFF4FF] uppercase">
                      {countryFlag(del) ? `${countryFlag(del)} ` : ''}{del}
                    </div>
                  ))}
                  {queue.length <= 1 && <span className="font-mono text-xs text-[#EFF4FF]/30">Queue is empty</span>}
                </div>
                {!readOnly && (
                <form onSubmit={addSpeaker} className="mt-3 flex gap-2">
                  <input
                    value={newSpeaker}
                    onChange={(e) => setNewSpeaker(e.target.value)}
                    placeholder="ADD SPEAKER"
                    className="flex-1 min-w-0 bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-[#EFF4FF]"
                  />
                  <button type="submit" className="px-3 border border-[#6FFF00]/40 text-[#6FFF00] hover:bg-[#6FFF00]/10 transition-colors" aria-label="Add speaker">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-full flex flex-col items-center justify-center border border-[#EFF4FF]/10 backdrop-blur-md transition-colors duration-500 ${isWarning ? 'bg-red-900/20 shadow-[0_0_50px_rgba(255,0,0,0.2)]' : 'bg-[#010828]/40'}`}>
            <span className="font-mono text-xl tracking-widest text-[#EFF4FF]/60 uppercase mb-8">Unmoderated Caucus</span>
            <span className={`font-mono text-[15vw] leading-none tracking-wider ${isWarning ? 'text-red-500 animate-pulse drop-shadow-[0_0_30px_rgba(255,0,0,0.8)]' : 'text-[#6FFF00] drop-shadow-[0_0_20px_rgba(111,255,0,0.3)]'}`}>
              {formatTime(totalTimeLeft)}
            </span>

            {!readOnly && (
            <div className="flex gap-2 mt-8 opacity-40 hover:opacity-100 transition-opacity z-20">
              <button onClick={() => actions.timer('caucusTotal', 'setDuration', 10 * 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTotalTime === 600 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>10m</button>
              <button onClick={() => actions.timer('caucusTotal', 'setDuration', 15 * 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTotalTime === 900 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>15m</button>
              <button onClick={() => actions.timer('caucusTotal', 'setDuration', 20 * 60)} className={`px-3 py-1 font-mono text-[10px] uppercase border ${initialTotalTime === 1200 ? 'border-[#6FFF00] text-[#6FFF00]' : 'border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]'}`}>20m</button>
              <div className="w-px h-4 bg-[#EFF4FF]/20 my-auto mx-1" />
              <button onClick={() => actions.timer('caucusTotal', 'addTime', -60)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">-1m</button>
              <button onClick={() => actions.timer('caucusTotal', 'addTime', 60)} className="px-3 py-1 font-mono text-[10px] uppercase border border-[#EFF4FF]/20 hover:bg-[#EFF4FF]/10 text-[#EFF4FF]">+1m</button>
            </div>
            )}

            {!readOnly && (
            <div className="flex gap-6 mt-10">
              <button
                onClick={() => actions.timer('caucusTotal', isTotalActive ? 'pause' : 'start')}
                className="bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/20 text-[#EFF4FF] font-black uppercase py-4 px-10 tracking-widest text-sm transition-colors"
              >
                {isTotalActive ? 'PAUSE TIMER' : 'START TIMER'}
              </button>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
