// Thin typed wrapper over the REST API. Every mutating call resolves to the
// fresh committee snapshot the server echoes back, so callers can apply it
// immediately without waiting for the SSE frame.

import type {
  CaucusMode,
  CommitteeState,
  TimerAction,
  TimerKey,
  ViewState,
} from '../types';

type VoteChoice = 'yea' | 'nay' | 'abstain';

async function mutate(
  path: string,
  body?: unknown,
  method: 'POST' | 'DELETE' = 'POST',
): Promise<CommitteeState> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error ?? `API ${method} ${path} failed (${res.status})`);
  }
  return res.json();
}

export const client = {
  getState: (): Promise<CommitteeState> =>
    fetch('/api/state').then((r) => r.json()),

  setView: (view: ViewState) => mutate('/view', { view }),

  // Committee identity + roster
  setCommittee: (fields: { name?: string; topic?: string }) => mutate('/committee', fields),
  setRoster: (names: string[]) => mutate('/delegates/bulk', { names }),

  // Roll call
  cycleDelegate: (id: string) => mutate(`/delegates/${id}/cycle`),
  addDelegate: (name: string) => mutate('/delegates', { name }),
  removeDelegate: (id: string) => mutate(`/delegates/${id}`, undefined, 'DELETE'),
  resetAttendance: () => mutate('/delegates/reset'),

  // GSL
  gslYield: () => mutate('/gsl/yield'),
  gslAddToQueue: (name: string) => mutate('/gsl/queue', { name }),
  gslRemoveFromQueue: (id: string) => mutate(`/gsl/queue/${id}`, undefined, 'DELETE'),

  // Round robin
  roundRobinNext: () => mutate('/round-robin/next'),
  roundRobinPrev: () => mutate('/round-robin/prev'),

  // Caucus
  caucusSetMode: (mode: CaucusMode) => mutate('/caucus/mode', { mode }),
  caucusSetTopic: (topic: string) => mutate('/caucus/topic', { topic }),
  caucusNext: () => mutate('/caucus/next'),
  caucusAddToQueue: (name: string) => mutate('/caucus/queue', { name }),

  // Voting
  votingSetActive: (code: string) => mutate('/voting/active', { code }),
  votingVote: (code: string, choice: VoteChoice) =>
    mutate('/voting/vote', { code, choice }),
  votingResetTally: (code: string) => mutate('/voting/reset', { code }),
  addWorkingPaper: (paper: { code: string; title: string; sponsors: string[] }) =>
    mutate('/voting/papers', paper),
  removeWorkingPaper: (id: string) =>
    mutate(`/voting/papers/${id}`, undefined, 'DELETE'),
  setPaperText: (id: string, text: string) =>
    mutate(`/voting/papers/${id}/text`, { text }),
  votingShowText: (show: boolean) => mutate('/voting/show-text', { show }),

  // Crisis
  setCrisis: (active: boolean) => mutate('/crisis', { active }),
  setCrisisDetails: (details: { topic?: string; briefing?: string; banner?: string }) =>
    mutate('/crisis/details', details),
  addCrisisUpdate: (text: string) => mutate('/crisis/updates', { text }),
  removeCrisisUpdate: (id: string) =>
    mutate(`/crisis/updates/${id}`, undefined, 'DELETE'),

  // Timers
  timer: (key: TimerKey, action: TimerAction, value?: number) =>
    mutate(`/timer/${key}`, { action, value }),
};

export type { VoteChoice };
