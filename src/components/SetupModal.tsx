import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useCommittee } from '../committee/CommitteeContext';

/** Chair-only committee setup: identity + bulk roster import. */
export default function SetupModal({ onClose }: { onClose: () => void }) {
  const { state, actions } = useCommittee();
  const [name, setName] = useState(state.session.committee.name);
  const [topic, setTopic] = useState(state.session.committee.topic);
  const [roster, setRoster] = useState(state.delegates.map((d) => d.name).join('\n'));

  const parsedRoster = roster
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const rosterChanged =
    parsedRoster.join('|').toUpperCase() !==
    state.delegates.map((d) => d.name).join('|').toUpperCase();

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setCommittee({ name, topic });
    if (parsedRoster.length && rosterChanged) actions.setRoster(parsedRoster);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#010828]/70 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={apply}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#EFF4FF]/20 bg-[#010828]/95 backdrop-blur-md p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EFF4FF]/40 hover:text-[#EFF4FF] transition-colors"
          aria-label="Close setup"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6FFF00]">
          Committee Setup
        </span>
        <h2 className="font-grotesk text-3xl uppercase tracking-tight leading-none mt-1 mb-8">
          Configure Session
        </h2>

        <label className="block mb-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EFF4FF]/60 mb-2 block">
            Committee Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. UN Security Council"
            className="w-full bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-4 py-3 font-mono text-sm tracking-wide uppercase text-[#EFF4FF] transition-colors"
          />
        </label>

        <label className="block mb-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EFF4FF]/60 mb-2 block">
            Committee Topic
          </span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Maritime Cybersecurity"
            className="w-full bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-4 py-3 font-mono text-sm tracking-wide uppercase text-[#EFF4FF] transition-colors"
          />
        </label>

        <label className="block mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EFF4FF]/60 mb-2 block">
            Delegate Roster — one country per line
          </span>
          <textarea
            value={roster}
            onChange={(e) => setRoster(e.target.value)}
            rows={8}
            placeholder={'USA\nCHINA\nRUSSIA\n…'}
            className="w-full bg-[#EFF4FF]/5 border border-[#EFF4FF]/20 focus:border-[#6FFF00] outline-none px-4 py-3 font-mono text-xs tracking-wide uppercase text-[#EFF4FF] transition-colors resize-y"
          />
        </label>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#EFF4FF]/40 mb-6">
          {parsedRoster.length} delegates
          {rosterChanged && parsedRoster.length > 0 && ' · replacing the roster clears attendance'}
        </p>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-[#3d5638] hover:bg-[#2d4228] border border-[#6FFF00]/30 text-[#EFF4FF] font-black uppercase py-3 tracking-widest text-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 bg-transparent hover:bg-[#EFF4FF]/10 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase py-3 tracking-widest text-xs transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="mt-8 pt-5 border-t border-[#EFF4FF]/10 font-mono text-[10px] uppercase tracking-[0.2em] text-center">
          <span className="text-[#EFF4FF]/40">WHIZKIDZ.MUN · Built by </span>
          <span className="text-[#6FFF00] font-bold">Tanmay Sukeerti M</span>
        </p>
      </form>
    </div>
  );
}
