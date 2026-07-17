import React, { useEffect, useRef, useState } from 'react';
import type { TimerKey } from '../types';
import { useCommittee } from './CommitteeContext';

// Fires a chime + screen flash the moment any running timer reaches zero, on
// every synced screen. Each running timer schedules a one-shot at its `endsAt`
// (corrected for clock skew); a per-arm guard prevents double-firing when
// unrelated snapshots arrive.

const TIMER_KEYS: TimerKey[] = ['gsl', 'roundRobin', 'caucusTotal', 'caucusSpeaker', 'crisis'];

let audioCtx: AudioContext | null = null;

function playChime(): void {
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    // Two short descending beeps.
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {
    /* audio blocked (e.g. no user gesture) — the flash still shows */
  }
}

export default function TimerAlerts() {
  const { state, offsetMs } = useCommittee();
  const timers = state.session.timers;
  const [pulse, setPulse] = useState(0);
  const firedRef = useRef<Partial<Record<TimerKey, number>>>({});
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const fire = () => {
      setPulse((p) => p + 1);
      playChime();
    };

    for (const key of TIMER_KEYS) {
      const t = timers[key];
      if (!t.isRunning || t.endsAt == null) continue;
      if (firedRef.current[key] === t.endsAt) continue; // already fired this arm
      const delay = Math.max(0, t.endsAt - (Date.now() + offsetMs));
      const endsAt = t.endsAt;
      const id = setTimeout(() => {
        if (firedRef.current[key] === endsAt) return;
        firedRef.current[key] = endsAt;
        fire();
      }, delay);
      timeoutsRef.current.push(id);
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [timers, offsetMs]);

  if (pulse === 0) return null;

  return (
    <div
      key={pulse}
      className="fixed inset-0 z-[200] pointer-events-none timer-flash"
      aria-hidden="true"
    />
  );
}
