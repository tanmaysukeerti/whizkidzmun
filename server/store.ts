// The committee store: the single authoritative copy of committee state.
//
// State lives in memory for fast reads/broadcasts and is written through to the
// persistence layer on every change. Timers are stored as `endsAt`-based
// descriptors (see shared/types.ts) so clients derive the ticking value locally
// and every screen agrees to the second.

import crypto from 'node:crypto';
import type {
  CommitteeState,
  Delegate,
  SessionState,
  TimerAction,
  TimerKey,
  TimerState,
  ViewState,
  WorkingPaper,
} from '../shared/types.ts';
import type { Persistence } from './persistence.ts';

type VoteChoice = 'yea' | 'nay' | 'abstain';

interface InternalState {
  delegates: Delegate[];
  workingPapers: WorkingPaper[];
  session: SessionState;
}

type Listener = (snapshot: CommitteeState) => void;

const listeners = new Set<Listener>();
let persistence: Persistence;
let state: InternalState;
let ticker: ReturnType<typeof setInterval> | undefined;

const id = () => crypto.randomUUID();

// ---------------------------------------------------------------------------
// Seed data (mirrors the values the views originally hard-coded)
// ---------------------------------------------------------------------------

const DELEGATE_NAMES = [
  'USA', 'CHINA', 'RUSSIA', 'UK', 'FRANCE', 'GERMANY', 'JAPAN', 'INDIA',
  'BRAZIL', 'SOUTH AFRICA', 'CANADA', 'AUSTRALIA', 'SOUTH KOREA', 'ITALY',
  'MEXICO', 'INDONESIA', 'TURKEY', 'SAUDI ARABIA', 'ARGENTINA', 'NIGERIA',
];

function seedDelegates(): Delegate[] {
  return DELEGATE_NAMES.map((name, i) => ({
    id: String(i + 1),
    name,
    status: 'ABSENT',
  }));
}

function seedWorkingPapers(): WorkingPaper[] {
  return [
    {
      id: id(),
      code: 'DR-01A',
      title: 'Maritime Data Encryption Standardization',
      sponsors: ['USA', 'UK', 'JAPAN', 'AUSTRALIA'],
      yea: 45,
      nay: 12,
      abstain: 8,
      text: [
        'The General Assembly,',
        '',
        'Recalling its previous resolutions on the security of international maritime data corridors,',
        'Noting with concern the rise in cyber incidents targeting commercial shipping lanes,',
        '',
        '1. Calls upon member states to adopt a common encryption baseline for vessel telemetry;',
        '2. Requests the Secretary-General to convene a technical working group within 90 days;',
        '3. Decides to remain actively seized of the matter.',
      ].join('\n'),
    },
    {
      id: id(),
      code: 'DR-02B',
      title: 'Open-Source Intelligence Sharing Protocols',
      sponsors: ['CHINA', 'RUSSIA', 'BRAZIL'],
      yea: 0,
      nay: 0,
      abstain: 0,
      text: '',
    },
    {
      id: id(),
      code: 'WP-1.3',
      title: 'Rapid Cyber Incident Response Force',
      sponsors: ['FRANCE', 'GERMANY', 'ITALY'],
      yea: 0,
      nay: 0,
      abstain: 0,
      text: '',
    },
  ];
}

function timer(durationSec: number): TimerState {
  return { durationSec, isRunning: false, endsAt: null, remainingSec: durationSec };
}

function seedTimers(): Record<TimerKey, TimerState> {
  return {
    gsl: timer(90),
    roundRobin: timer(60),
    caucusTotal: timer(15 * 60),
    caucusSpeaker: timer(45),
    crisis: timer(15 * 60),
  };
}

function seedSession(): SessionState {
  return {
    activeView: 'HOME',
    committee: {
      name: 'GENERAL ASSEMBLY',
      topic: 'OVERWATCH MATRIX',
    },
    gsl: {
      currentSpeaker: 'UNITED KINGDOM',
      queue: [
        { id: id(), name: 'FRANCE' },
        { id: id(), name: 'JAPAN' },
        { id: id(), name: 'BRAZIL' },
        { id: id(), name: 'NIGERIA' },
        { id: id(), name: 'INDIA' },
      ],
    },
    roundRobin: {
      activeIndex: 2,
      roster: ['CANADA', 'GERMANY', 'SOUTH KOREA', 'CHINA', 'USA', 'ARGENTINA', 'ITALY'],
    },
    caucus: {
      mode: 'MODERATED',
      topic: 'Reviewing Cybersecurity Frameworks in Maritime Zones',
      queue: ['MEXICO', 'FRANCE', 'USA', 'SOUTH AFRICA'],
    },
    voting: { activePaperCode: 'DR-01A', showText: false },
    crisis: {
      active: false,
      banner: 'CRISIS COMMITTEE // LIVE SCENARIO IN SESSION',
      topic: 'UNFOLDING CRISIS — SET THE SCENARIO',
      briefing:
        'Use the edit control to brief delegates on the crisis scenario: the situation on the ground, escalations, and the directives currently in play.',
      updates: [],
    },
    timers: seedTimers(),
  };
}

/** Merge a loaded session over defaults so missing/newer fields never crash. */
function reconcileSession(loaded: SessionState): SessionState {
  const base = seedSession();
  return {
    ...base,
    ...loaded,
    committee: { ...base.committee, ...loaded.committee },
    gsl: { ...base.gsl, ...loaded.gsl },
    roundRobin: { ...base.roundRobin, ...loaded.roundRobin },
    caucus: { ...base.caucus, ...loaded.caucus },
    voting: { ...base.voting, ...loaded.voting },
    crisis: { ...base.crisis, ...loaded.crisis },
    timers: { ...base.timers, ...loaded.timers },
  };
}

// ---------------------------------------------------------------------------
// Broadcast + persistence plumbing
// ---------------------------------------------------------------------------

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function snapshot(): CommitteeState {
  return {
    delegates: state.delegates,
    workingPapers: state.workingPapers,
    session: state.session,
    serverNow: Date.now(),
  };
}

function emit(): void {
  const snap = snapshot();
  for (const listener of listeners) listener(snap);
}

function persistDelegates(): void {
  persistence.saveDelegates(state.delegates).catch((e) =>
    console.error('[persist:delegates]', e),
  );
}
function persistPapers(): void {
  persistence.saveWorkingPapers(state.workingPapers).catch((e) =>
    console.error('[persist:workingPapers]', e),
  );
}
function persistSession(): void {
  persistence.saveSession(state.session).catch((e) =>
    console.error('[persist:session]', e),
  );
}

// ---------------------------------------------------------------------------
// Timer helpers (pure operations on a TimerState)
// ---------------------------------------------------------------------------

function remainingNow(t: TimerState, now: number): number {
  if (t.isRunning && t.endsAt != null) {
    return Math.max(0, Math.ceil((t.endsAt - now) / 1000));
  }
  return t.remainingSec;
}

function applyTimerAction(
  t: TimerState,
  action: TimerAction,
  value: number | undefined,
  now: number,
): TimerState {
  switch (action) {
    case 'start': {
      if (t.isRunning) return t;
      const remaining = t.remainingSec > 0 ? t.remainingSec : t.durationSec;
      return { ...t, isRunning: true, endsAt: now + remaining * 1000, remainingSec: remaining };
    }
    case 'pause': {
      if (!t.isRunning) return t;
      return { ...t, isRunning: false, endsAt: null, remainingSec: remainingNow(t, now) };
    }
    case 'reset':
      return { ...t, isRunning: false, endsAt: null, remainingSec: t.durationSec };
    case 'setDuration': {
      const d = Math.max(0, Math.round(value ?? t.durationSec));
      return { durationSec: d, isRunning: false, endsAt: null, remainingSec: d };
    }
    case 'addTime': {
      const delta = Math.round(value ?? 0);
      if (t.isRunning && t.endsAt != null) {
        const endsAt = Math.max(now, t.endsAt + delta * 1000);
        return { ...t, endsAt, remainingSec: Math.max(0, Math.ceil((endsAt - now) / 1000)) };
      }
      return { ...t, remainingSec: Math.max(0, t.remainingSec + delta) };
    }
    default:
      return t;
  }
}

/** Re-arm a timer to a full duration, keeping its running state. */
function rearm(t: TimerState, now: number): TimerState {
  if (t.isRunning) {
    return { ...t, endsAt: now + t.durationSec * 1000, remainingSec: t.durationSec };
  }
  return { ...t, endsAt: null, remainingSec: t.durationSec };
}

// ---------------------------------------------------------------------------
// Expiry ticker: the only server-side clock. It performs at-zero actions
// (round-robin auto-advance, others stop) and broadcasts only when something
// actually changes — never a per-second stream.
// ---------------------------------------------------------------------------

function startTicker(): void {
  if (ticker) return;
  ticker = setInterval(() => {
    const now = Date.now();
    let changed = false;
    const timers = state.session.timers;

    for (const key of Object.keys(timers) as TimerKey[]) {
      const t = timers[key];
      if (!t.isRunning || t.endsAt == null || t.endsAt > now) continue;

      if (key === 'roundRobin') {
        const rr = state.session.roundRobin;
        if (rr.activeIndex < rr.roster.length - 1) {
          rr.activeIndex += 1;
          timers[key] = { ...t, endsAt: now + t.durationSec * 1000, remainingSec: t.durationSec };
        } else {
          timers[key] = { ...t, isRunning: false, endsAt: null, remainingSec: 0 };
        }
      } else {
        timers[key] = { ...t, isRunning: false, endsAt: null, remainingSec: 0 };
      }
      changed = true;
    }

    if (changed) {
      persistSession();
      emit();
    }
  }, 1000);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export async function initStore(p: Persistence): Promise<void> {
  persistence = p;
  const data = await p.load();
  state = {
    delegates: data.delegates ?? seedDelegates(),
    // `text: ''` first so papers persisted before the field existed stay valid.
    workingPapers: (data.workingPapers ?? seedWorkingPapers()).map((p) => ({ text: '', ...p })),
    session: data.session ? reconcileSession(data.session) : seedSession(),
  };
  if (!data.delegates) persistDelegates();
  if (!data.workingPapers) persistPapers();
  if (!data.session) persistSession();
  startTicker();
}

// ---------------------------------------------------------------------------
// Mutators — every one persists the slice it touched and broadcasts.
// ---------------------------------------------------------------------------

const CYCLE: Record<Delegate['status'], Delegate['status']> = {
  ABSENT: 'PRESENT',
  PRESENT: 'PRESENT_VOTING',
  PRESENT_VOTING: 'ABSENT',
};

export function cycleDelegate(delegateId: string): void {
  const d = state.delegates.find((x) => x.id === delegateId);
  if (!d) return;
  d.status = CYCLE[d.status];
  persistDelegates();
  emit();
}

export function addDelegate(name: string): void {
  const clean = name.trim().toUpperCase();
  if (!clean) return;
  state.delegates.push({ id: id(), name: clean, status: 'ABSENT' });
  persistDelegates();
  emit();
}

/** Replace the entire roster (all marked absent). Used by bulk import. */
export function setRoster(names: string[]): void {
  const seen = new Set<string>();
  const roster: Delegate[] = [];
  for (const raw of names) {
    const clean = raw.trim().toUpperCase();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    roster.push({ id: id(), name: clean, status: 'ABSENT' });
  }
  if (roster.length === 0) return;
  state.delegates = roster;
  persistDelegates();
  emit();
}

export function setCommittee(fields: { name?: string; topic?: string }): void {
  const c = state.session.committee;
  if (fields.name !== undefined) c.name = fields.name.trim() || c.name;
  if (fields.topic !== undefined) c.topic = fields.topic.trim() || c.topic;
  persistSession();
  emit();
}

export function removeDelegate(delegateId: string): void {
  state.delegates = state.delegates.filter((d) => d.id !== delegateId);
  persistDelegates();
  emit();
}

export function resetAttendance(): void {
  state.delegates.forEach((d) => (d.status = 'ABSENT'));
  persistDelegates();
  emit();
}

export function setView(view: ViewState): void {
  state.session.activeView = view;
  // Entering the crisis screen arms & starts its countdown, matching the
  // original auto-start behaviour; the flag mirrors the active view.
  if (view === 'CRISIS') {
    state.session.crisis.active = true;
    const t = state.session.timers.crisis;
    state.session.timers.crisis = {
      ...t,
      isRunning: true,
      endsAt: Date.now() + t.durationSec * 1000,
      remainingSec: t.durationSec,
    };
  } else {
    state.session.crisis.active = false;
  }
  persistSession();
  emit();
}

export function gslYield(): void {
  const { gsl } = state.session;
  if (gsl.queue.length > 0) {
    gsl.currentSpeaker = gsl.queue[0].name;
    gsl.queue = gsl.queue.slice(1);
  } else {
    gsl.currentSpeaker = 'NONE';
  }
  state.session.timers.gsl = applyTimerAction(state.session.timers.gsl, 'reset', undefined, Date.now());
  persistSession();
  emit();
}

export function gslAddToQueue(name: string): void {
  const clean = name.trim().toUpperCase();
  if (!clean) return;
  state.session.gsl.queue.push({ id: id(), name: clean });
  persistSession();
  emit();
}

export function gslRemoveFromQueue(entryId: string): void {
  state.session.gsl.queue = state.session.gsl.queue.filter((q) => q.id !== entryId);
  persistSession();
  emit();
}

export function roundRobinNext(): void {
  const rr = state.session.roundRobin;
  if (rr.activeIndex < rr.roster.length - 1) rr.activeIndex += 1;
  state.session.timers.roundRobin = rearm(state.session.timers.roundRobin, Date.now());
  persistSession();
  emit();
}

export function roundRobinPrev(): void {
  const rr = state.session.roundRobin;
  if (rr.activeIndex > 0) rr.activeIndex -= 1;
  // Stepping back stops the clock at a full duration, like the original.
  const t = state.session.timers.roundRobin;
  state.session.timers.roundRobin = { ...t, isRunning: false, endsAt: null, remainingSec: t.durationSec };
  persistSession();
  emit();
}

export function caucusSetMode(mode: SessionState['caucus']['mode']): void {
  state.session.caucus.mode = mode;
  persistSession();
  emit();
}

export function caucusSetTopic(topic: string): void {
  state.session.caucus.topic = topic;
  persistSession();
  emit();
}

export function caucusNext(): void {
  state.session.caucus.queue = state.session.caucus.queue.slice(1);
  state.session.timers.caucusSpeaker = applyTimerAction(
    state.session.timers.caucusSpeaker, 'reset', undefined, Date.now(),
  );
  persistSession();
  emit();
}

export function caucusAddToQueue(name: string): void {
  const clean = name.trim().toUpperCase();
  if (!clean) return;
  state.session.caucus.queue.push(clean);
  persistSession();
  emit();
}

export function votingSetActive(code: string): void {
  if (!state.workingPapers.some((p) => p.code === code)) return;
  state.session.voting.activePaperCode = code;
  persistSession();
  emit();
}

export function votingVote(code: string, choice: VoteChoice): void {
  const paper = state.workingPapers.find((p) => p.code === code);
  if (!paper) return;
  paper[choice] += 1;
  persistPapers();
  emit();
}

export function votingResetTally(code: string): void {
  const paper = state.workingPapers.find((p) => p.code === code);
  if (!paper) return;
  paper.yea = 0;
  paper.nay = 0;
  paper.abstain = 0;
  persistPapers();
  emit();
}

export function updatePaperText(paperId: string, text: string): void {
  const paper = state.workingPapers.find((p) => p.id === paperId);
  if (!paper) return;
  paper.text = text;
  persistPapers();
  emit();
}

export function setVotingShowText(show: boolean): void {
  state.session.voting.showText = show;
  persistSession();
  emit();
}

export function addWorkingPaper(input: {
  code: string;
  title: string;
  sponsors?: string[];
}): void {
  const code = input.code.trim().toUpperCase();
  if (!code || state.workingPapers.some((p) => p.code === code)) return;
  state.workingPapers.push({
    id: id(),
    code,
    title: input.title.trim() || 'Untitled Working Paper',
    sponsors: (input.sponsors ?? []).map((s) => s.trim().toUpperCase()).filter(Boolean),
    yea: 0,
    nay: 0,
    abstain: 0,
    text: '',
  });
  persistPapers();
  emit();
}

export function removeWorkingPaper(paperId: string): void {
  const removed = state.workingPapers.find((p) => p.id === paperId);
  state.workingPapers = state.workingPapers.filter((p) => p.id !== paperId);
  if (removed && state.session.voting.activePaperCode === removed.code) {
    state.session.voting.activePaperCode = state.workingPapers[0]?.code ?? null;
    persistSession();
  }
  persistPapers();
  emit();
}

export function setCrisis(active: boolean): void {
  state.session.crisis.active = active;
  persistSession();
  emit();
}

export function updateCrisisDetails(details: {
  topic?: string;
  briefing?: string;
  banner?: string;
}): void {
  const c = state.session.crisis;
  if (details.topic !== undefined) c.topic = details.topic;
  if (details.briefing !== undefined) c.briefing = details.briefing;
  if (details.banner !== undefined) c.banner = details.banner;
  persistSession();
  emit();
}

/** Newest updates first; capped so the snapshot payload stays bounded. */
const MAX_CRISIS_UPDATES = 50;

export function addCrisisUpdate(text: string): void {
  const clean = text.trim();
  if (!clean) return;
  state.session.crisis.updates.unshift({ id: id(), time: Date.now(), text: clean });
  state.session.crisis.updates = state.session.crisis.updates.slice(0, MAX_CRISIS_UPDATES);
  persistSession();
  emit();
}

export function removeCrisisUpdate(updateId: string): void {
  state.session.crisis.updates = state.session.crisis.updates.filter((u) => u.id !== updateId);
  persistSession();
  emit();
}

export function timerAction(key: TimerKey, action: TimerAction, value?: number): void {
  const t = state.session.timers[key];
  if (!t) return;
  state.session.timers[key] = applyTimerAction(t, action, value, Date.now());
  persistSession();
  emit();
}
