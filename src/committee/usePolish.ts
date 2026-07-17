// Projector polish utilities: keep the screen awake, hide the idle cursor,
// and toggle fullscreen. All degrade silently on browsers/contexts that don't
// support the underlying API.

import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', cb: () => void) => void;
}
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
};

/**
 * Hold a screen wake lock while mounted so a projector/laptop never dims or
 * sleeps mid-session. Re-acquires when the tab becomes visible again (the
 * browser auto-releases on tab switch/minimise).
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request('screen');
        if (disposed) await sentinel.release();
      } catch {
        /* denied (battery saver, hidden tab, insecure context) — fine */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, [enabled]);
}

/** Hide the mouse cursor after a few idle seconds (projector screens). */
export function useIdleCursor(enabled: boolean, idleMs = 3000): void {
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    let timeout: ReturnType<typeof setTimeout>;

    const arm = () => {
      root.classList.remove('cursor-hidden');
      clearTimeout(timeout);
      timeout = setTimeout(() => root.classList.add('cursor-hidden'), idleMs);
    };

    arm();
    window.addEventListener('mousemove', arm);
    window.addEventListener('mousedown', arm);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', arm);
      window.removeEventListener('mousedown', arm);
      root.classList.remove('cursor-hidden');
    };
  }, [enabled, idleMs]);
}

/** Enter/exit fullscreen on the whole document. */
export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {});
  } else {
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}
