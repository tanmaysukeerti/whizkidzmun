// Durable storage for the committee.
//
// Two backends implement the same `Persistence` interface:
//   • PostgresStore — used when DATABASE_URL is set (Supabase / any Postgres).
//   • MemoryStore   — zero-config fallback so the app boots before a DB exists.
//
// The mutable committee/session data is stored as JSONB documents in a small
// key/value table (it is inherently a single evolving document).

import type {
  Delegate,
  SessionState,
  WorkingPaper,
} from '../shared/types.ts';

export interface PersistedData {
  delegates: Delegate[] | null;
  workingPapers: WorkingPaper[] | null;
  session: SessionState | null;
}

export interface Persistence {
  mode: 'postgres' | 'memory';
  load(): Promise<PersistedData>;
  saveDelegates(delegates: Delegate[]): Promise<void>;
  saveWorkingPapers(papers: WorkingPaper[]): Promise<void>;
  saveSession(session: SessionState): Promise<void>;
  close(): Promise<void>;
}

const EMPTY: PersistedData = {
  delegates: null,
  workingPapers: null,
  session: null,
};

/** In-memory backend: keeps nothing across restarts. */
class MemoryStore implements Persistence {
  mode = 'memory' as const;
  async load(): Promise<PersistedData> {
    return { ...EMPTY };
  }
  async saveDelegates(): Promise<void> {}
  async saveWorkingPapers(): Promise<void> {}
  async saveSession(): Promise<void> {}
  async close(): Promise<void> {}
}

/** Postgres backend (node-postgres). Exported for testing against a mock pool. */
export class PostgresStore implements Persistence {
  mode = 'postgres' as const;
  // Typed as any so `pg` stays an optional dependency (dynamic import below).
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS committee (
        key   text PRIMARY KEY,
        value jsonb NOT NULL
      );
    `);
  }

  private async readKey<T>(key: string): Promise<T | null> {
    const { rows } = await this.pool.query(
      'SELECT value FROM committee WHERE key = $1',
      [key],
    );
    return rows.length ? (rows[0].value as T) : null;
  }

  private async writeKey(key: string, value: unknown): Promise<void> {
    await this.pool.query(
      `INSERT INTO committee (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, JSON.stringify(value)],
    );
  }

  async load(): Promise<PersistedData> {
    const [delegates, workingPapers, session] = await Promise.all([
      this.readKey<Delegate[]>('delegates'),
      this.readKey<WorkingPaper[]>('workingPapers'),
      this.readKey<SessionState>('session'),
    ]);
    return { delegates, workingPapers, session };
  }

  saveDelegates(delegates: Delegate[]): Promise<void> {
    return this.writeKey('delegates', delegates);
  }

  saveWorkingPapers(papers: WorkingPaper[]): Promise<void> {
    return this.writeKey('workingPapers', papers);
  }

  saveSession(session: SessionState): Promise<void> {
    return this.writeKey('session', session);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Build the persistence layer. Falls back to in-memory (with a loud warning)
 * when DATABASE_URL is missing or the connection cannot be established.
 */
export async function createPersistence(): Promise<Persistence> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn(
      '\x1b[33m[persistence] DATABASE_URL not set — using in-memory store. ' +
        'Data will NOT survive a restart. Set DATABASE_URL to enable Postgres.\x1b[0m',
    );
    return new MemoryStore();
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: url,
      ssl: requiresSsl(url) ? { rejectUnauthorized: false } : undefined,
    });
    // Fail fast if the credentials/host are wrong.
    await pool.query('SELECT 1');
    const store = new PostgresStore(pool);
    await store.init();
    console.log('\x1b[32m[persistence] Connected to Postgres.\x1b[0m');
    return store;
  } catch (err) {
    console.error(
      '\x1b[31m[persistence] Failed to connect to Postgres — falling back to ' +
        'in-memory store. Fix DATABASE_URL to persist data.\x1b[0m',
    );
    console.error(err instanceof Error ? err.message : err);
    return new MemoryStore();
  }
}

/** Hosted Postgres (Supabase, Neon, RDS, …) needs SSL; local usually doesn't. */
function requiresSsl(url: string): boolean {
  if (/sslmode=disable/.test(url)) return false;
  if (/sslmode=require/.test(url)) return true;
  try {
    const host = new URL(url).hostname;
    return host !== 'localhost' && host !== '127.0.0.1';
  } catch {
    return false;
  }
}
