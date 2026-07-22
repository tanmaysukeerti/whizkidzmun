import React, { useState } from 'react';
import { FileText, Pencil, X } from 'lucide-react';
import type { WorkingPaper } from '../types';
import { useCommittee } from '../committee/CommitteeContext';

// Full-screen projection of the active draft resolution. Visibility is part of
// synced session state (voting.showText), so the chair toggling it projects the
// text on every screen at once. Operative clauses (lines starting "N.") get
// their numbers highlighted; the live tally rides along in the footer.

function ClauseLine({ line }: { line: string }) {
  const m = line.match(/^(\s*\d+\.)\s*(.*)$/);
  if (m) {
    return (
      <p className="leading-relaxed">
        <span className="text-[#6FFF00] font-bold">{m[1]}</span> {m[2]}
      </p>
    );
  }
  return <p className="leading-relaxed min-h-[1em]">{line}</p>;
}

export default function ResolutionViewer({ paper }: { paper: WorkingPaper }) {
  const { actions, readOnly } = useCommittee();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(paper.text);

  // Close with Escape key even in read-only (projector) mode.
  React.useEffect(() => {
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && actions.votingShowText(false);
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [actions]);

  const total = paper.yea + paper.nay + paper.abstain;
  const passed = total > 0 && paper.yea > total / 2;
  const pctOf = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setPaperText(paper.id, draft);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#010828]/97 backdrop-blur-md flex flex-col">
      <div className="grid-bg" />

      {/* Fixed close button (top-right corner, always accessible) */}
      <button
        onClick={() => actions.votingShowText(false)}
        className="fixed top-6 right-6 z-[90] p-2 text-[#EFF4FF]/70 hover:text-[#EFF4FF] hover:bg-[#EFF4FF]/10 transition-all border border-[#EFF4FF]/30 rounded"
        aria-label="Close resolution (Escape key)"
        title="Press Escape or click to close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-6 px-6 sm:px-12 pt-8 pb-5 border-b border-[#EFF4FF]/20">
        <div className="min-w-0">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#6FFF00] uppercase flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Resolution on the Floor
          </span>
          <h2 className="font-grotesk text-3xl sm:text-4xl uppercase tracking-wide text-[#EFF4FF] mt-2 truncate">
            {paper.code} — {paper.title}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {paper.sponsors.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-[#EFF4FF]/10 font-mono text-[9px] text-[#EFF4FF]/60 uppercase tracking-widest">
                {s}
              </span>
            ))}
          </div>
        </div>

        {!readOnly && !editing && (
          <button
            onClick={() => { setDraft(paper.text); setEditing(true); }}
            className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest border border-[#6FFF00]/40 text-[#6FFF00] hover:bg-[#6FFF00]/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Text
          </button>
        )}
      </div>

      {/* Body */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-12 py-8">
        {editing ? (
          <form onSubmit={save} className="h-full flex flex-col gap-4 max-w-4xl mx-auto">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={'Paste the draft resolution text…\n\nThe General Assembly,\n\nRecalling …,\n\n1. Calls upon …;\n2. Requests …;'}
              className="flex-1 min-h-[50vh] bg-[#010118] border border-[#6FFF00]/40 focus:border-[#6FFF00] outline-none px-5 py-4 font-mono text-sm text-[#EFF4FF] leading-relaxed resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest border border-[#EFF4FF]/30 text-[#EFF4FF]/70 hover:bg-[#EFF4FF]/10 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest border border-[#6FFF00]/50 text-[#6FFF00] hover:bg-[#6FFF00]/10 transition-colors">
                Save Text
              </button>
            </div>
          </form>
        ) : paper.text.trim() ? (
          <div className="max-w-4xl mx-auto font-mono text-base sm:text-lg text-[#EFF4FF]/90 flex flex-col gap-1">
            {paper.text.split('\n').map((line, i) => (
              <ClauseLine key={i} line={line} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <FileText className="w-10 h-10 text-[#EFF4FF]/20" />
            <p className="font-mono text-xs uppercase tracking-widest text-[#EFF4FF]/40">
              No resolution text yet
            </p>
            {!readOnly && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#EFF4FF]/30">
                Use “Edit Text” to paste the draft
              </p>
            )}
          </div>
        )}

        {passed && !editing && (
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
            <div className="font-condiment text-[#6FFF00] text-7xl sm:text-8xl opacity-30 -rotate-12 drop-shadow-[0_0_20px_rgba(111,255,0,0.4)]">
              Passed / Adopted
            </div>
          </div>
        )}
      </div>

      {/* Footer: live tally rail */}
      <div className="relative z-10 border-t border-[#EFF4FF]/20 px-6 sm:px-12 py-4 flex flex-col sm:flex-row gap-3 sm:gap-8 bg-[#010828]/80">
        {([
          ['YEA', paper.yea, '#6FFF00'],
          ['NAY', paper.nay, '#ef4444'],
          ['ABSTAIN', paper.abstain, 'rgba(239,244,255,0.4)'],
        ] as const).map(([label, count, color]) => (
          <div key={label} className="flex-1 flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EFF4FF]/70 w-16">{label}</span>
            <div className="flex-1 h-3 border border-[#EFF4FF]/20 bg-[#EFF4FF]/5 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out"
                style={{ width: `${pctOf(count)}%`, background: color }}
              />
            </div>
            <span className="font-mono text-sm font-bold text-[#EFF4FF] w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
