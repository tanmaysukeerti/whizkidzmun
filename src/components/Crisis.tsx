import React, { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Radio, Send, Trash2, X } from 'lucide-react';
import { useCommittee } from '../committee/CommitteeContext';
import { useLiveSeconds } from '../committee/useTimer';

export default function Crisis() {
  const { state, actions, offsetMs, readOnly } = useCommittee();
  const crisisTimer = state.session.timers.crisis;
  const timeLeft = useLiveSeconds(crisisTimer, offsetMs);
  const { banner, topic, briefing, updates } = state.session.crisis;

  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState(topic);
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingDraft, setBriefingDraft] = useState(briefing);
  const [updateDraft, setUpdateDraft] = useState('');

  // Flash the whole screen when a new update lands — on every synced screen.
  const [flashKey, setFlashKey] = useState(0);
  const lastUpdateId = useRef<string | null>(updates[0]?.id ?? null);
  useEffect(() => {
    const newest = updates[0]?.id ?? null;
    if (newest && newest !== lastUpdateId.current) setFlashKey((k) => k + 1);
    lastUpdateId.current = newest;
  }, [updates]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const saveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setCrisisDetails({ topic: topicDraft.trim() || 'UNTITLED CRISIS' });
    setEditingTopic(false);
  };
  const saveBriefing = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setCrisisDetails({ briefing: briefingDraft });
    setEditingBriefing(false);
  };
  const pushUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateDraft.trim()) return;
    actions.addCrisisUpdate(updateDraft);
    setUpdateDraft('');
  };

  const stamp = (ms: number) =>
    new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // #FF3333 is Crisis Red, #FF9900 is Amber — kept for the crisis-committee look.
  return (
    <div className="fixed inset-0 z-[100] bg-[#010118] flex flex-col font-mono text-[#EFF4FF] overflow-y-auto">
      {/* Scanline specifically tinted red for crisis */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(1,8,40,0)_50%,rgba(255,51,51,0.05)_50%),linear-gradient(90deg,rgba(255,51,51,0.05),rgba(255,51,51,0.02),rgba(255,51,51,0.05))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,51,51,0.12)_0%,transparent_80%)] pointer-events-none" />

      {/* New-update flash */}
      {flashKey > 0 && (
        <div key={flashKey} className="fixed inset-0 z-[110] pointer-events-none crisis-flash" aria-hidden="true" />
      )}

      {/* Top Banner */}
      <div className="w-full bg-[#FF3333] text-[#010128] font-bold text-center py-4 tracking-[0.3em] uppercase text-sm sm:text-base shadow-[0_0_30px_rgba(255,51,51,0.6)] relative z-20">
        {banner}
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-10 py-8 relative z-20 max-w-6xl mx-auto w-full">

        {/* Warning Border Box */}
        <div className="w-full border-2 border-[#FF3333] shadow-[0_0_20px_rgba(255,51,51,0.2),inset_0_0_20px_rgba(255,51,51,0.1)] p-1 sm:p-2 bg-[#FF3333]/5 relative">

          {/* Header Line */}
          <div className="flex justify-between items-center text-[#FF3333] text-[10px] sm:text-xs tracking-widest uppercase mb-4 font-bold border-b border-[#FF3333]/30 pb-2 px-4 pt-2">
            <span>[!] CRISIS COMMITTEE // DIRECTIVE PROTOCOL ACTIVE</span>
            <span>[ SESSION 44.B ]</span>
          </div>

          {/* Active Crisis Topic (chair-editable) */}
          <div className="px-4 sm:px-6 my-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#FF9900] text-[10px] sm:text-xs tracking-widest uppercase font-bold">
                [ Active Crisis Topic ]
              </span>
              {!readOnly && !editingTopic && (
                <button
                  onClick={() => { setTopicDraft(topic); setEditingTopic(true); }}
                  className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase tracking-widest border border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit Topic
                </button>
              )}
            </div>

            {!readOnly && editingTopic ? (
              <form onSubmit={saveTopic} className="flex flex-col sm:flex-row gap-2 items-stretch">
                <input
                  autoFocus
                  value={topicDraft}
                  onChange={(e) => setTopicDraft(e.target.value)}
                  placeholder="e.g. Naval blockade in the Baltic Strait"
                  className="flex-1 bg-[#010128]/80 border border-[#FF3333]/50 focus:border-[#FF3333] outline-none px-4 py-3 font-bold uppercase tracking-wider text-lg sm:text-2xl text-[#EFF4FF]"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 flex items-center justify-center border border-[#FF3333]/50 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors" aria-label="Save topic">
                    <Check className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => setEditingTopic(false)} className="px-4 flex items-center justify-center border border-[#EFF4FF]/30 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10 transition-colors" aria-label="Cancel">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              <h2 className="text-[#FF3333] font-bold tracking-wider uppercase text-2xl sm:text-4xl lg:text-5xl leading-tight drop-shadow-[0_0_15px_rgba(255,51,51,0.5)]">
                {topic}
              </h2>
            )}
          </div>

          {/* Crisis Timeline Clock */}
          <div className="text-center my-8 sm:my-10">
            <span className="text-[#FF3333]/60 text-[10px] tracking-widest uppercase block mb-2 font-bold">
              [ CRISIS TIMELINE CLOCK ]
            </span>
            <div className="text-[#FF3333] text-[4rem] sm:text-6xl lg:text-[100px] leading-none drop-shadow-[0_0_25px_rgba(255,51,51,0.8)] font-bold">
              {minutes}:{seconds}
            </div>
            {/* Chair-only crisis clock controls */}
            {!readOnly && (
              <div className="flex flex-wrap justify-center gap-2 mt-6 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={() => actions.timer('crisis', crisisTimer.isRunning ? 'pause' : 'start')} className="px-4 py-1.5 text-[10px] uppercase tracking-widest border border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors">
                  {crisisTimer.isRunning ? 'Pause' : 'Start'}
                </button>
                <button onClick={() => actions.timer('crisis', 'reset')} className="px-4 py-1.5 text-[10px] uppercase tracking-widest border border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors">
                  Reset
                </button>
                <button onClick={() => actions.timer('crisis', 'setDuration', 10 * 60)} className={`px-4 py-1.5 text-[10px] uppercase tracking-widest border ${crisisTimer.durationSec === 600 ? 'border-[#FF9900] text-[#FF9900]' : 'border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10'} transition-colors`}>10m</button>
                <button onClick={() => actions.timer('crisis', 'setDuration', 15 * 60)} className={`px-4 py-1.5 text-[10px] uppercase tracking-widest border ${crisisTimer.durationSec === 900 ? 'border-[#FF9900] text-[#FF9900]' : 'border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10'} transition-colors`}>15m</button>
                <button onClick={() => actions.timer('crisis', 'addTime', 60)} className="px-4 py-1.5 text-[10px] uppercase tracking-widest border border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors">+1m</button>
                <button onClick={() => actions.setView('HOME')} className="px-4 py-1.5 text-[10px] uppercase tracking-widest border border-[#EFF4FF]/30 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10 transition-colors">
                  Stand Down
                </button>
              </div>
            )}
          </div>

          {/* Briefing + Live Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 m-2 sm:m-4">

            {/* Scenario Briefing (chair-editable) */}
            <div className="border border-[#FF3333]/40 bg-[#010128]/80 p-6 shadow-[0_0_15px_rgba(255,51,51,0.1)]">
              <div className="flex items-center justify-between mb-4 border-b border-[#FF3333]/30 pb-2">
                <span className="text-[#FF3333] text-[10px] sm:text-xs tracking-widest uppercase font-bold">
                  Scenario Briefing:
                </span>
                {!readOnly && !editingBriefing && (
                  <button
                    onClick={() => { setBriefingDraft(briefing); setEditingBriefing(true); }}
                    className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase tracking-widest border border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              {!readOnly && editingBriefing ? (
                <form onSubmit={saveBriefing} className="flex flex-col gap-3">
                  <textarea
                    autoFocus
                    rows={6}
                    value={briefingDraft}
                    onChange={(e) => setBriefingDraft(e.target.value)}
                    placeholder="Brief delegates on the crisis scenario, escalations, and directives in play…"
                    className="w-full bg-[#010118] border border-[#FF3333]/50 focus:border-[#FF3333] outline-none px-4 py-3 text-[#EFF4FF] text-sm sm:text-base leading-relaxed resize-y"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditingBriefing(false)} className="px-4 py-2 text-[10px] uppercase tracking-widest border border-[#EFF4FF]/30 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-[10px] uppercase tracking-widest border border-[#FF3333]/50 text-[#FF3333] hover:bg-[#FF3333]/10 transition-colors">
                      Save Briefing
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[#EFF4FF] text-sm sm:text-lg leading-relaxed sm:leading-loose whitespace-pre-wrap">
                  {briefing}
                </p>
              )}
            </div>

            {/* Live Incident Feed */}
            <div className="border border-[#FF9900]/40 bg-[#010128]/80 p-6 shadow-[0_0_15px_rgba(255,153,0,0.08)] flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-[#FF9900]/30 pb-2">
                <span className="text-[#FF9900] text-[10px] sm:text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Incident Feed
                </span>
                <span className="text-[#FF9900]/50 text-[9px] tracking-widest uppercase">{updates.length} update{updates.length === 1 ? '' : 's'}</span>
              </div>

              {!readOnly && (
                <form onSubmit={pushUpdate} className="flex gap-2 mb-4">
                  <input
                    value={updateDraft}
                    onChange={(e) => setUpdateDraft(e.target.value)}
                    placeholder="PUSH A CRISIS UPDATE…"
                    className="flex-1 min-w-0 bg-[#010118] border border-[#FF9900]/40 focus:border-[#FF9900] outline-none px-3 py-2 text-[11px] tracking-wider uppercase text-[#EFF4FF]"
                  />
                  <button type="submit" className="px-3 border border-[#FF9900]/50 text-[#FF9900] hover:bg-[#FF9900]/10 transition-colors" aria-label="Push update">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="flex-1 overflow-y-auto max-h-72 flex flex-col gap-2 pr-1">
                {updates.map((u, i) => (
                  <div
                    key={u.id}
                    className={`group relative border px-3 py-2.5 ${
                      i === 0
                        ? 'border-[#FF9900]/60 bg-[#FF9900]/5 crisis-slam'
                        : 'border-[#EFF4FF]/10 bg-[#EFF4FF]/[0.02]'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className={`text-[9px] tracking-widest shrink-0 ${i === 0 ? 'text-[#FF9900]' : 'text-[#EFF4FF]/40'}`}>
                        {stamp(u.time)}
                      </span>
                      <p className={`text-xs sm:text-sm leading-relaxed uppercase tracking-wide ${i === 0 ? 'text-[#EFF4FF]' : 'text-[#EFF4FF]/70'}`}>
                        {u.text}
                      </p>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => actions.removeCrisisUpdate(u.id)}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-[#EFF4FF]/30 hover:text-[#FF3333] transition-all"
                        aria-label="Delete update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {updates.length === 0 && (
                  <p className="text-[#EFF4FF]/30 text-[10px] uppercase tracking-widest text-center py-8">
                    No incidents reported — the feed is quiet… for now
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
