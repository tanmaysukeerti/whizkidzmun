// REST API. Every mutating endpoint calls a store mutator (which persists and
// broadcasts over SSE) and echoes back the fresh snapshot, so the calling
// client updates instantly even before its own SSE frame arrives.

import { Router } from 'express';
import type {
  CaucusMode,
  TimerAction,
  TimerKey,
  ViewState,
} from '../shared/types.ts';
import * as store from './store.ts';

const VIEWS: ViewState[] = ['HOME', 'ROLL_CALL', 'GSL', 'ROUND_ROBIN', 'CAUCUS', 'VOTING', 'CRISIS'];
const TIMER_KEYS: TimerKey[] = ['gsl', 'roundRobin', 'caucusTotal', 'caucusSpeaker', 'crisis'];
const TIMER_ACTIONS: TimerAction[] = ['start', 'pause', 'reset', 'setDuration', 'addTime'];
const VOTE_CHOICES = ['yea', 'nay', 'abstain'] as const;
const CAUCUS_MODES: CaucusMode[] = ['MODERATED', 'UNMODERATED'];

export const api = Router();

/** Reply with the current full snapshot. */
function ok(res: import('express').Response) {
  res.json(store.snapshot());
}
function bad(res: import('express').Response, msg: string) {
  res.status(400).json({ error: msg });
}

// --- State -----------------------------------------------------------------

api.get('/state', (_req, res) => ok(res));

// --- Roll call -------------------------------------------------------------

api.post('/delegates', (req, res) => {
  const name = String(req.body?.name ?? '');
  if (!name.trim()) return bad(res, 'name is required');
  store.addDelegate(name);
  ok(res);
});

api.post('/delegates/reset', (_req, res) => {
  store.resetAttendance();
  ok(res);
});

api.post('/delegates/bulk', (req, res) => {
  const names = req.body?.names;
  if (!Array.isArray(names)) return bad(res, 'names must be an array');
  store.setRoster(names.map(String));
  ok(res);
});

api.post('/committee', (req, res) => {
  const fields: { name?: string; topic?: string } = {};
  if (req.body?.name !== undefined) fields.name = String(req.body.name);
  if (req.body?.topic !== undefined) fields.topic = String(req.body.topic);
  store.setCommittee(fields);
  ok(res);
});

api.post('/delegates/:id/cycle', (req, res) => {
  store.cycleDelegate(req.params.id);
  ok(res);
});

api.delete('/delegates/:id', (req, res) => {
  store.removeDelegate(req.params.id);
  ok(res);
});

// --- Active view (shared so the projector follows the chair) ---------------

api.post('/view', (req, res) => {
  const view = req.body?.view as ViewState;
  if (!VIEWS.includes(view)) return bad(res, 'invalid view');
  store.setView(view);
  ok(res);
});

// --- GSL -------------------------------------------------------------------

api.post('/gsl/yield', (_req, res) => {
  store.gslYield();
  ok(res);
});

api.post('/gsl/queue', (req, res) => {
  const name = String(req.body?.name ?? '');
  if (!name.trim()) return bad(res, 'name is required');
  store.gslAddToQueue(name);
  ok(res);
});

api.delete('/gsl/queue/:id', (req, res) => {
  store.gslRemoveFromQueue(req.params.id);
  ok(res);
});

// --- Round robin -----------------------------------------------------------

api.post('/round-robin/next', (_req, res) => {
  store.roundRobinNext();
  ok(res);
});

api.post('/round-robin/prev', (_req, res) => {
  store.roundRobinPrev();
  ok(res);
});

// --- Caucus ----------------------------------------------------------------

api.post('/caucus/mode', (req, res) => {
  const mode = req.body?.mode as CaucusMode;
  if (!CAUCUS_MODES.includes(mode)) return bad(res, 'invalid mode');
  store.caucusSetMode(mode);
  ok(res);
});

api.post('/caucus/topic', (req, res) => {
  store.caucusSetTopic(String(req.body?.topic ?? ''));
  ok(res);
});

api.post('/caucus/next', (_req, res) => {
  store.caucusNext();
  ok(res);
});

api.post('/caucus/queue', (req, res) => {
  const name = String(req.body?.name ?? '');
  if (!name.trim()) return bad(res, 'name is required');
  store.caucusAddToQueue(name);
  ok(res);
});

// --- Voting ----------------------------------------------------------------

api.post('/voting/active', (req, res) => {
  const code = String(req.body?.code ?? '');
  if (!code) return bad(res, 'code is required');
  store.votingSetActive(code);
  ok(res);
});

api.post('/voting/vote', (req, res) => {
  const code = String(req.body?.code ?? '');
  const choice = req.body?.choice;
  if (!code) return bad(res, 'code is required');
  if (!VOTE_CHOICES.includes(choice)) return bad(res, 'invalid choice');
  store.votingVote(code, choice);
  ok(res);
});

api.post('/voting/reset', (req, res) => {
  const code = String(req.body?.code ?? '');
  if (!code) return bad(res, 'code is required');
  store.votingResetTally(code);
  ok(res);
});

api.post('/voting/papers', (req, res) => {
  const code = String(req.body?.code ?? '');
  const title = String(req.body?.title ?? '');
  const sponsors = Array.isArray(req.body?.sponsors) ? req.body.sponsors.map(String) : [];
  if (!code.trim()) return bad(res, 'code is required');
  store.addWorkingPaper({ code, title, sponsors });
  ok(res);
});

api.delete('/voting/papers/:id', (req, res) => {
  store.removeWorkingPaper(req.params.id);
  ok(res);
});

api.post('/voting/papers/:id/text', (req, res) => {
  store.updatePaperText(req.params.id, String(req.body?.text ?? ''));
  ok(res);
});

api.post('/voting/show-text', (req, res) => {
  store.setVotingShowText(Boolean(req.body?.show));
  ok(res);
});

// --- Crisis ----------------------------------------------------------------

api.post('/crisis', (req, res) => {
  store.setCrisis(Boolean(req.body?.active));
  ok(res);
});

api.post('/crisis/details', (req, res) => {
  const details: { topic?: string; briefing?: string; banner?: string } = {};
  if (req.body?.topic !== undefined) details.topic = String(req.body.topic);
  if (req.body?.briefing !== undefined) details.briefing = String(req.body.briefing);
  if (req.body?.banner !== undefined) details.banner = String(req.body.banner);
  store.updateCrisisDetails(details);
  ok(res);
});

api.post('/crisis/updates', (req, res) => {
  const text = String(req.body?.text ?? '');
  if (!text.trim()) return bad(res, 'text is required');
  store.addCrisisUpdate(text);
  ok(res);
});

api.delete('/crisis/updates/:id', (req, res) => {
  store.removeCrisisUpdate(req.params.id);
  ok(res);
});

// --- Timers (one endpoint for every countdown) -----------------------------

api.post('/timer/:key', (req, res) => {
  const key = req.params.key as TimerKey;
  const action = req.body?.action as TimerAction;
  if (!TIMER_KEYS.includes(key)) return bad(res, 'invalid timer');
  if (!TIMER_ACTIONS.includes(action)) return bad(res, 'invalid action');
  const value = req.body?.value == null ? undefined : Number(req.body.value);
  if (value != null && Number.isNaN(value)) return bad(res, 'invalid value');
  store.timerAction(key, action, value);
  ok(res);
});
