import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { client, type VoteChoice } from '../api/client';
import type {
  CaucusMode,
  CommitteeState,
  TimerAction,
  TimerKey,
  ViewState,
} from '../types';

interface CommitteeContextValue {
  /** Guaranteed non-null: children only render once the first snapshot arrives. */
  state: CommitteeState;
  /** True while the SSE stream is open. */
  connected: boolean;
  /** serverNow − clientNow, in ms; added to Date.now() to correct clock skew. */
  offsetMs: number;
  /** Projector / view-only mode: controls are hidden and actions are no-ops. */
  readOnly: boolean;
  actions: {
    setView: (view: ViewState) => void;
    setCommittee: (fields: { name?: string; topic?: string }) => void;
    setRoster: (names: string[]) => void;
    cycleDelegate: (id: string) => void;
    addDelegate: (name: string) => void;
    removeDelegate: (id: string) => void;
    resetAttendance: () => void;
    gslYield: () => void;
    gslAddToQueue: (name: string) => void;
    gslRemoveFromQueue: (id: string) => void;
    roundRobinNext: () => void;
    roundRobinPrev: () => void;
    caucusSetMode: (mode: CaucusMode) => void;
    caucusSetTopic: (topic: string) => void;
    caucusNext: () => void;
    caucusAddToQueue: (name: string) => void;
    votingSetActive: (code: string) => void;
    votingVote: (code: string, choice: VoteChoice) => void;
    votingResetTally: (code: string) => void;
    addWorkingPaper: (paper: { code: string; title: string; sponsors: string[] }) => void;
    removeWorkingPaper: (id: string) => void;
    setPaperText: (id: string, text: string) => void;
    votingShowText: (show: boolean) => void;
    setCrisis: (active: boolean) => void;
    setCrisisDetails: (details: { topic?: string; briefing?: string; banner?: string }) => void;
    addCrisisUpdate: (text: string) => void;
    removeCrisisUpdate: (id: string) => void;
    timer: (key: TimerKey, action: TimerAction, value?: number) => void;
  };
}

const Ctx = createContext<CommitteeContextValue | null>(null);

export function CommitteeProvider({
  children,
  readOnly = false,
}: {
  children: React.ReactNode;
  readOnly?: boolean;
}) {
  const [state, setState] = useState<CommitteeState | null>(null);
  const [connected, setConnected] = useState(false);
  const offsetRef = useRef(0);
  const [offsetMs, setOffsetMs] = useState(0);

  // Apply a snapshot (from SSE or an action's echo) and re-estimate clock skew.
  const apply = useCallback((snap: CommitteeState) => {
    const offset = snap.serverNow - Date.now();
    offsetRef.current = offset;
    setOffsetMs(offset);
    setState(snap);
  }, []);

  // Live-sync stream. EventSource auto-reconnects on drop.
  useEffect(() => {
    const es = new EventSource('/events');
    es.onmessage = (evt) => {
      try {
        apply(JSON.parse(evt.data) as CommitteeState);
        setConnected(true);
      } catch {
        /* ignore malformed frame */
      }
    };
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [apply]);

  // Fire an API call and apply its echoed snapshot for instant local feedback.
  const run = useCallback(
    (p: Promise<CommitteeState>) => {
      p.then(apply).catch((err) => console.error('[committee] action failed:', err));
    },
    [apply],
  );

  // In read-only (projector) mode every action is a no-op — the client call is
  // never even constructed, so a projector screen can never mutate state.
  const actions = useMemo<CommitteeContextValue['actions']>(() => {
    const noop = () => {};
    return {
      setView: readOnly ? noop : (view) => run(client.setView(view)),
      setCommittee: readOnly ? noop : (fields) => run(client.setCommittee(fields)),
      setRoster: readOnly ? noop : (names) => run(client.setRoster(names)),
      cycleDelegate: readOnly ? noop : (id) => run(client.cycleDelegate(id)),
      addDelegate: readOnly ? noop : (name) => run(client.addDelegate(name)),
      removeDelegate: readOnly ? noop : (id) => run(client.removeDelegate(id)),
      resetAttendance: readOnly ? noop : () => run(client.resetAttendance()),
      gslYield: readOnly ? noop : () => run(client.gslYield()),
      gslAddToQueue: readOnly ? noop : (name) => run(client.gslAddToQueue(name)),
      gslRemoveFromQueue: readOnly ? noop : (id) => run(client.gslRemoveFromQueue(id)),
      roundRobinNext: readOnly ? noop : () => run(client.roundRobinNext()),
      roundRobinPrev: readOnly ? noop : () => run(client.roundRobinPrev()),
      caucusSetMode: readOnly ? noop : (mode) => run(client.caucusSetMode(mode)),
      caucusSetTopic: readOnly ? noop : (topic) => run(client.caucusSetTopic(topic)),
      caucusNext: readOnly ? noop : () => run(client.caucusNext()),
      caucusAddToQueue: readOnly ? noop : (name) => run(client.caucusAddToQueue(name)),
      votingSetActive: readOnly ? noop : (code) => run(client.votingSetActive(code)),
      votingVote: readOnly ? noop : (code, choice) => run(client.votingVote(code, choice)),
      votingResetTally: readOnly ? noop : (code) => run(client.votingResetTally(code)),
      addWorkingPaper: readOnly ? noop : (paper) => run(client.addWorkingPaper(paper)),
      removeWorkingPaper: readOnly ? noop : (id) => run(client.removeWorkingPaper(id)),
      setPaperText: readOnly ? noop : (id, text) => run(client.setPaperText(id, text)),
      votingShowText: readOnly ? noop : (show) => run(client.votingShowText(show)),
      setCrisis: readOnly ? noop : (active) => run(client.setCrisis(active)),
      setCrisisDetails: readOnly ? noop : (details) => run(client.setCrisisDetails(details)),
      addCrisisUpdate: readOnly ? noop : (text) => run(client.addCrisisUpdate(text)),
      removeCrisisUpdate: readOnly ? noop : (id) => run(client.removeCrisisUpdate(id)),
      timer: readOnly ? noop : (key, action, value) => run(client.timer(key, action, value)),
    };
  }, [run, readOnly]);

  if (!state) {
    return <ConnectingScreen connected={connected} />;
  }

  return (
    <Ctx.Provider value={{ state, connected, offsetMs, readOnly, actions }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCommittee(): CommitteeContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCommittee must be used within a CommitteeProvider');
  return ctx;
}

function ConnectingScreen({ connected }: { connected: boolean }) {
  return (
    <div className="fixed inset-0 bg-[#010828] text-[#EFF4FF] flex flex-col items-center justify-center font-mono">
      <div className="w-3 h-3 rounded-full bg-[#6FFF00] animate-pulse shadow-[0_0_12px_#6FFF00] mb-6" />
      <span className="text-xs uppercase tracking-[0.3em] opacity-70">
        {connected ? 'Syncing committee state…' : 'Establishing secure link…'}
      </span>
    </div>
  );
}
