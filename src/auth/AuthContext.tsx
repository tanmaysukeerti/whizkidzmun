import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// ---------------------------------------------------------------------------
// Hardcoded chair credentials.
//
// This is a single-committee dais tool, so a simple front-of-house gate is all
// that's needed — there is no user database. Change these to whatever the chair
// should type in. (Kept intentionally simple per project scope.)
// ---------------------------------------------------------------------------
const CHAIR = {
  username: 'chair',
  password: 'whizkidz',
  displayName: 'Committee Chair',
};

const STORAGE_KEY = 'mun.auth.v1';

interface AuthContextValue {
  authed: boolean;
  displayName: string | null;
  /** Returns null on success, or an error message on failure. */
  login: (username: string, password: string) => string | null;
  logout: () => void;
}

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Restore a previous session from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { displayName?: string };
        setAuthed(true);
        setDisplayName(parsed.displayName ?? CHAIR.displayName);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const login = useCallback((username: string, password: string): string | null => {
    const ok =
      username.trim().toLowerCase() === CHAIR.username &&
      password === CHAIR.password;
    if (!ok) return 'Invalid credentials. Access denied.';
    setAuthed(true);
    setDisplayName(CHAIR.displayName);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ displayName: CHAIR.displayName }));
    } catch {
      /* non-fatal */
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    setDisplayName(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* non-fatal */
    }
  }, []);

  return (
    <Ctx.Provider value={{ authed, displayName, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
