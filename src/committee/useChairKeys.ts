import { useEffect } from 'react';
import type {
  CaucusMode,
  SessionState,
  TimerKey,
  ViewState,
} from '../types';
import { toggleFullscreen } from './usePolish';

interface ChairKeysConfig {
  enabled: boolean;
  activeView: ViewState;
  caucusMode: CaucusMode;
  timers: SessionState['timers'];
  actions: {
    setView: (view: ViewState) => void;
    gslYield: () => void;
    roundRobinNext: () => void;
    roundRobinPrev: () => void;
    caucusNext: () => void;
    timer: (key: TimerKey, action: 'start' | 'pause' | 'reset') => void;
  };
  onToggleHelp: () => void;
}

const VIEW_BY_DIGIT: Record<string, ViewState> = {
  '1': 'HOME',
  '2': 'ROLL_CALL',
  '3': 'GSL',
  '4': 'ROUND_ROBIN',
  '5': 'CAUCUS',
  '6': 'VOTING',
};

/**
 * Global chair hotkeys (disabled in read-only mode and while typing):
 *   1–6  switch view · Space start/pause the active timer · R reset it
 *   N    next speaker/yield · ←/→ round-robin prev/next · ? shortcuts help
 */
export function useChairKeys({
  enabled,
  activeView,
  caucusMode,
  timers,
  actions,
  onToggleHelp,
}: ChairKeysConfig): void {
  useEffect(() => {
    if (!enabled) return;

    // The timer a Space/R press should drive, given the current view.
    const activeTimer = (): TimerKey | null => {
      switch (activeView) {
        case 'GSL':
          return 'gsl';
        case 'ROUND_ROBIN':
          return 'roundRobin';
        case 'CAUCUS':
          return caucusMode === 'MODERATED' ? 'caucusSpeaker' : 'caucusTotal';
        case 'CRISIS':
          return 'crisis';
        default:
          return null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      if (VIEW_BY_DIGIT[e.key]) {
        e.preventDefault();
        actions.setView(VIEW_BY_DIGIT[e.key]);
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        const t = activeTimer();
        if (t) {
          e.preventDefault();
          actions.timer(t, timers[t].isRunning ? 'pause' : 'start');
        }
        return;
      }

      if (key === 'r') {
        const t = activeTimer();
        if (t) {
          e.preventDefault();
          actions.timer(t, 'reset');
        }
        return;
      }

      if (key === 'n') {
        if (activeView === 'GSL') { e.preventDefault(); actions.gslYield(); }
        else if (activeView === 'ROUND_ROBIN') { e.preventDefault(); actions.roundRobinNext(); }
        else if (activeView === 'CAUCUS') { e.preventDefault(); actions.caucusNext(); }
        return;
      }

      if (activeView === 'ROUND_ROBIN') {
        if (e.key === 'ArrowRight') { e.preventDefault(); actions.roundRobinNext(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); actions.roundRobinPrev(); }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, activeView, caucusMode, timers, actions, onToggleHelp]);
}
