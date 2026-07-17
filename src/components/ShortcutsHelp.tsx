import React from 'react';
import { X } from 'lucide-react';

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '1 – 6', label: 'Switch view (Overwatch → Voting)' },
  { keys: 'Space', label: 'Start / pause the active timer' },
  { keys: 'R', label: 'Reset the active timer' },
  { keys: 'N', label: 'Next speaker / yield (GSL, Round Robin, Caucus)' },
  { keys: '← / →', label: 'Round Robin previous / next' },
  { keys: 'F', label: 'Toggle fullscreen' },
  { keys: '?', label: 'Toggle this help' },
];

export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#010828]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md border border-[#EFF4FF]/20 bg-[#010828]/95 backdrop-blur-md p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EFF4FF]/40 hover:text-[#EFF4FF] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6FFF00]">
          Chair Controls
        </span>
        <h2 className="font-grotesk text-3xl uppercase tracking-tight leading-none mt-1 mb-6">
          Keyboard Shortcuts
        </h2>
        <div className="flex flex-col divide-y divide-[#EFF4FF]/10">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-3 gap-4">
              <span className="font-mono text-xs text-[#EFF4FF]/70 leading-relaxed">{s.label}</span>
              <kbd className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest text-[#6FFF00] border border-[#6FFF00]/30 bg-[#6FFF00]/5 px-3 py-1">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
