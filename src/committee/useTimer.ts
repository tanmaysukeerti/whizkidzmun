// Derives the live countdown value from a server-authoritative TimerState.
// While running, the value is computed from `endsAt` against the server clock
// (corrected for skew via offsetMs) and refreshed a few times a second. When
// paused/stopped it simply reflects `remainingSec`. No per-tick network traffic.

import { useEffect, useState } from 'react';
import type { TimerState } from '../types';

export function useLiveSeconds(timer: TimerState, offsetMs: number): number {
  const compute = (): number => {
    if (timer.isRunning && timer.endsAt != null) {
      const now = Date.now() + offsetMs;
      return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
    }
    return timer.remainingSec;
  };

  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    setSeconds(compute());
    if (!timer.isRunning) return;
    const iv = setInterval(() => setSeconds(compute()), 250);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isRunning, timer.endsAt, timer.remainingSec, offsetMs]);

  return seconds;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
