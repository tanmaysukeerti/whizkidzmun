import React, { useState } from 'react';
import { FileText, Plus, RotateCcw, X } from 'lucide-react';
import { useCommittee } from '../committee/CommitteeContext';
import ResolutionViewer from './ResolutionViewer';

export default function Voting() {
  const { state, actions, readOnly } = useCommittee();
  const papers = state.workingPapers;
  const activeCode = state.session.voting.activePaperCode;
  const activePaper = papers.find(p => p.code === activeCode) ?? papers[0];
  const showText = state.session.voting.showText;

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', sponsors: '' });

  const votes = activePaper
    ? { yea: activePaper.yea, nay: activePaper.nay, abstain: activePaper.abstain }
    : { yea: 0, nay: 0, abstain: 0 };
  const totalVotes = votes.yea + votes.nay + votes.abstain;
  const passed = totalVotes > 0 && votes.yea > totalVotes / 2;
  const pctOf = (n: number) => (totalVotes > 0 ? (n / totalVotes) * 100 : 0);

  const submitPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    actions.addWorkingPaper({
      code: form.code,
      title: form.title,
      sponsors: form.sponsors.split(',').map(s => s.trim()).filter(Boolean),
    });
    setForm({ code: '', title: '', sponsors: '' });
    setShowAdd(false);
  };

  return (
    <div className="w-full h-full flex flex-col pt-24 sm:pt-32 px-6 sm:px-12 pb-12 z-20 relative">
      {showText && activePaper && <ResolutionViewer paper={activePaper} />}

      <div className="mb-8 flex items-center gap-4">
        <span className="font-grotesk text-2xl tracking-wide uppercase text-[#EFF4FF]">Resolution Matrix & Voting</span>
        <div className="h-px bg-[#EFF4FF]/20 flex-1" />
        {!readOnly && (
          <button
            disabled={!activePaper}
            onClick={() => actions.votingShowText(!showText)}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border transition-colors disabled:opacity-30 ${
              showText
                ? 'border-[#6FFF00] text-[#6FFF00] bg-[#6FFF00]/10'
                : 'border-[#EFF4FF]/20 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10'
            }`}
            title="Project the active paper's full text on every screen"
          >
            <FileText className="w-3.5 h-3.5" />
            {showText ? 'Stop Projecting' : 'Project Resolution'}
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">

        {/* Phase A: Sponsors & Signatories Panel */}
        <div className="lg:w-1/3 flex flex-col border border-[#EFF4FF]/20 bg-[#010828]/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-[#EFF4FF]/5 border-b border-[#EFF4FF]/20 p-4 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-[#EFF4FF]/60 uppercase">Working Papers</span>
            {!readOnly && (
              <button
                onClick={() => setShowAdd(v => !v)}
                className="text-[#6FFF00] hover:bg-[#6FFF00]/10 p-1 transition-colors"
                aria-label="Add working paper"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {showAdd && (
            <form onSubmit={submitPaper} className="p-4 border-b border-[#EFF4FF]/20 flex flex-col gap-2 bg-[#EFF4FF]/[0.02]">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CODE (E.G. DR-03C)"
                className="bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-[#EFF4FF]"
              />
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="TITLE"
                className="bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-[#EFF4FF]"
              />
              <input
                value={form.sponsors}
                onChange={(e) => setForm({ ...form, sponsors: e.target.value })}
                placeholder="SPONSORS (COMMA SEPARATED)"
                className="bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-[#EFF4FF]"
              />
              <button type="submit" className="mt-1 bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/20 text-[#EFF4FF] font-black uppercase py-2 tracking-widest text-[10px] transition-colors">
                Register Paper
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {papers.map(wp => (
              <button
                key={wp.code}
                onClick={readOnly ? undefined : () => actions.votingSetActive(wp.code)}
                className={`group text-left p-4 border transition-colors flex flex-col gap-2 relative ${readOnly ? 'cursor-default' : ''} ${activePaper?.code === wp.code ? 'border-[#6FFF00] bg-[#6FFF00]/5 shadow-[0_0_10px_rgba(111,255,0,0.1)]' : 'border-[#EFF4FF]/10 hover:border-[#EFF4FF]/30'}`}
              >
                {!readOnly && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); actions.removeWorkingPaper(wp.id); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[#EFF4FF]/40 hover:text-red-400 transition-all"
                    aria-label={`Remove ${wp.code}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <span className={`font-mono text-sm font-bold tracking-widest uppercase ${activePaper?.code === wp.code ? 'text-[#6FFF00]' : 'text-[#EFF4FF]'}`}>
                  {wp.code}
                </span>
                <span className="font-mono text-[10px] text-[#EFF4FF]/70 truncate leading-relaxed">
                  {wp.title}
                </span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {wp.sponsors.map(sponsor => (
                    <span key={sponsor} className="px-1.5 py-0.5 bg-[#EFF4FF]/10 font-mono text-[8px] text-[#EFF4FF]/60 uppercase tracking-widest">
                      {sponsor}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {papers.length === 0 && (
              <div className="text-center font-mono text-xs text-[#EFF4FF]/40 mt-10">NO WORKING PAPERS</div>
            )}
          </div>
        </div>

        {/* Phase B: The Live Vote Counter Matrix */}
        <div className="lg:w-2/3 border border-[#EFF4FF]/20 bg-[#010828]/60 backdrop-blur-sm p-8 flex flex-col relative overflow-hidden">

          <div className="mb-10">
            <span className="font-mono text-[10px] tracking-widest text-[#EFF4FF]/60 uppercase mb-2 block">Active Voting Procedure</span>
            <h2 className="font-grotesk text-4xl sm:text-5xl tracking-wide uppercase text-[#EFF4FF]">
              {activePaper ? `Draft Resolution ${activePaper.code}` : 'No Paper Selected'}
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-8 relative z-10">
            {/* YEA */}
            <div className="relative w-full">
              <div className="flex justify-between font-mono text-xs tracking-widest uppercase text-[#EFF4FF] mb-2 font-bold">
                <span>In Favor (YEA)</span>
                <span>{votes.yea}</span>
              </div>
              <div className="w-full h-8 border border-[#EFF4FF]/20 bg-[#EFF4FF]/5 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#6FFF00] transition-all duration-1000 ease-out"
                  style={{ width: `${pctOf(votes.yea)}%` }}
                />
              </div>
            </div>

            {/* NAY */}
            <div className="relative w-full">
              <div className="flex justify-between font-mono text-xs tracking-widest uppercase text-[#EFF4FF] mb-2 font-bold">
                <span>Against (NAY)</span>
                <span>{votes.nay}</span>
              </div>
              <div className="w-full h-8 border border-[#EFF4FF]/20 bg-[#EFF4FF]/5 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-500 transition-all duration-1000 ease-out"
                  style={{ width: `${pctOf(votes.nay)}%` }}
                />
              </div>
            </div>

            {/* ABSTAIN */}
            <div className="relative w-full">
              <div className="flex justify-between font-mono text-xs tracking-widest uppercase text-[#EFF4FF] mb-2 font-bold">
                <span>Abstain</span>
                <span>{votes.abstain}</span>
              </div>
              <div className="w-full h-8 border border-[#EFF4FF]/20 bg-[#EFF4FF]/5 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#EFF4FF]/40 transition-all duration-1000 ease-out"
                  style={{ width: `${pctOf(votes.abstain)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Projector Visualization Stamp */}
          {passed && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="font-condiment text-[#6FFF00] text-7xl sm:text-8xl lg:text-9xl opacity-90 -rotate-12 drop-shadow-[0_0_20px_rgba(111,255,0,0.6)]">
                Passed / Adopted
              </div>
            </div>
          )}

          {/* Live vote controls */}
          {!readOnly && (
          <div className="mt-auto border-t border-[#EFF4FF]/20 pt-6 flex flex-wrap gap-3 z-30">
            <button
              disabled={!activePaper}
              onClick={() => activePaper && actions.votingVote(activePaper.code, 'yea')}
              className="px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border border-[#6FFF00]/40 text-[#6FFF00] hover:bg-[#6FFF00]/10 transition-colors disabled:opacity-30"
            >
              + YEA
            </button>
            <button
              disabled={!activePaper}
              onClick={() => activePaper && actions.votingVote(activePaper.code, 'nay')}
              className="px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
            >
              + NAY
            </button>
            <button
              disabled={!activePaper}
              onClick={() => activePaper && actions.votingVote(activePaper.code, 'abstain')}
              className="px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border border-[#EFF4FF]/20 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10 transition-colors disabled:opacity-30"
            >
              + ABSTAIN
            </button>
            <button
              disabled={!activePaper}
              onClick={() => activePaper && actions.votingResetTally(activePaper.code)}
              className="ml-auto flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border border-[#EFF4FF]/20 text-[#EFF4FF]/60 hover:bg-[#EFF4FF]/10 transition-colors disabled:opacity-30"
            >
              <RotateCcw className="w-3 h-3" /> Reset Tally
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
