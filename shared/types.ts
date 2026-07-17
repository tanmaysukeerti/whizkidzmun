// Shared committee state model — imported by BOTH the Express server and the
// React client so the wire format is defined in exactly one place.

export type ViewState =
  | 'HOME'
  | 'ROLL_CALL'
  | 'GSL'
  | 'ROUND_ROBIN'
  | 'CAUCUS'
  | 'VOTING'
  | 'CRISIS';

export type AttendanceStatus = 'ABSENT' | 'PRESENT' | 'PRESENT_VOTING';

export type CaucusMode = 'MODERATED' | 'UNMODERATED';

export interface Delegate {
  id: string;
  name: string;
  status: AttendanceStatus;
}

export interface QueueEntry {
  id: string;
  name: string;
}

export interface WorkingPaper {
  id: string;
  code: string;
  title: string;
  sponsors: string[];
  yea: number;
  nay: number;
  abstain: number;
  /** Full draft-resolution text, projected by the resolution viewer. */
  text: string;
}

/** A timestamped crisis update pushed to every screen while in crisis. */
export interface CrisisUpdate {
  id: string;
  /** Server epoch ms when the update was issued. */
  time: number;
  text: string;
}

/**
 * A timer that is authoritative on the server. The server never streams a tick
 * every second; instead it stores the *shape* of the countdown and each client
 * derives the current value locally from `endsAt` against the server clock.
 * That keeps the projector and the chair's controls in perfect agreement with
 * almost no network traffic.
 */
export interface TimerState {
  /** Configured length, in seconds. */
  durationSec: number;
  /** Whether the countdown is currently running. */
  isRunning: boolean;
  /** Epoch ms (server clock) at which the timer hits zero; null when paused/stopped. */
  endsAt: number | null;
  /** Seconds remaining while paused/stopped; ignored while running. */
  remainingSec: number;
}

export type TimerKey =
  | 'gsl'
  | 'roundRobin'
  | 'caucusTotal'
  | 'caucusSpeaker'
  | 'crisis';

export type TimerAction =
  | 'start'
  | 'pause'
  | 'reset'
  | 'setDuration'
  | 'addTime';

export interface SessionState {
  /** The view currently on screen — shared, so the projector follows the chair. */
  activeView: ViewState;
  /** Committee identity, shown on the overwatch/home screen. */
  committee: {
    name: string;
    topic: string;
  };
  gsl: {
    currentSpeaker: string;
    queue: QueueEntry[];
  };
  roundRobin: {
    activeIndex: number;
    roster: string[];
  };
  caucus: {
    mode: CaucusMode;
    topic: string;
    queue: string[];
  };
  voting: {
    activePaperCode: string | null;
    /** When true, every screen projects the active paper's resolution text. */
    showText: boolean;
  };
  crisis: {
    active: boolean;
    banner: string;
    /** The crisis-committee scenario title (chair-editable). */
    topic: string;
    /** Longer scenario briefing shown to delegates (chair-editable). */
    briefing: string;
    /** Live incident feed, newest first. */
    updates: CrisisUpdate[];
  };
  timers: Record<TimerKey, TimerState>;
}

/** The complete committee snapshot sent over the wire on every change. */
export interface CommitteeState {
  delegates: Delegate[];
  workingPapers: WorkingPaper[];
  session: SessionState;
  /** Server epoch ms, stamped at send time so clients can correct clock skew. */
  serverNow: number;
}
