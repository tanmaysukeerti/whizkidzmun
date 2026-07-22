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

  // A stale connection handed out right after Neon wakes from suspend fails the
  // FIRST query with a connection error, then works. Retrying with a short
  // backoff turns that silent lost-write into a successful save (a single
  // immediate retry can land on another still-waking connection).
  private async query(text: string, params?: unknown[]): Promise<any> {
    const backoffs = [0, 300, 900]; // up to 3 attempts
    let lastErr: unknown;
    for (const wait of backoffs) {
      if (wait) await new Promise((r) => setTimeout(r, wait));
      try {
        return await this.pool.query(text, params);
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!/terminat|connection|ECONNRESET|socket|timeout/i.test(msg)) throw err;
      }
    }
    throw lastErr;
  }

  async init(): Promise<void> {
    await this.query(`
      CREATE TABLE IF NOT EXISTS committee (
        key   text PRIMARY KEY,
        value jsonb NOT NULL
      );
    `);
  }

  private async readKey<T>(key: string): Promise<T | null> {
    const { rows } = await this.query(
      'SELECT value FROM committee WHERE key = $1',
      [key],
    );
    return rows.length ? (rows[0].value as T) : null;
  }

  private async writeKey(key: string, value: unknown): Promise<void> {
    await this.query(
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Build the persistence layer.
 *
 * • No DATABASE_URL  → in-memory store (intentional zero-config path).
 * • DATABASE_URL set → connect to Postgres, RETRYING through the cold start a
 *   serverless DB (Neon/Supabase) needs after it auto-suspends. If it still
 *   can't connect we throw instead of falling back to memory: a silent memory
 *   fallback makes initStore see an "empty" DB and RESEED the default committee,
 *   which then overwrites the real data once the DB comes back — i.e. the
 *   "my deleted resolutions keep coming back" bug. Failing loudly is safe;
 *   reseeding over live data is not.
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

  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: url,
    ssl: requiresSsl(url) ? { rejectUnauthorized: false } : undefined,
    // Serverless Postgres (Neon/Supabase) suspends when idle and drops idle
    // connections. keepAlive + a short idle timeout let the pool recycle dead
    // sockets instead of handing out a broken one on the next query.
    keepAlive: true,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  // Without this listener, an idle connection dropped by the server (which is
  // exactly what Neon does on auto-suspend) emits an 'error' event on the Pool
  // that Node treats as unhandled and CRASHES the whole process. Swallow it —
  // the pool transparently opens a fresh connection on the next query.
  pool.on('error', (err: Error) => {
    console.error('\x1b[33m[persistence] idle client error (recovered):\x1b[0m', err.message);
  });

  // Retry the initial connect: a suspended Neon compute takes a few seconds to
  // wake, and a single attempt can lose that race.
  const MAX_ATTEMPTS = 6;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await pool.query('SELECT 1');
      const store = new PostgresStore(pool);
      await store.init();
      console.log('\x1b[32m[persistence] Connected to Postgres.\x1b[0m');
      return store;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          `\x1b[33m[persistence] DB not ready (attempt ${attempt}/${MAX_ATTEMPTS}): ` +
            `${msg} — retrying…\x1b[0m`,
        );
        await sleep(attempt * 1500); // 1.5s, 3s, 4.5s, 6s, 7.5s ≈ 22s total
      } else {
        await pool.end().catch(() => {});
        console.error(
          '\x1b[31m[persistence] Could NOT reach the database after ' +
            `${MAX_ATTEMPTS} attempts. Refusing to start on the in-memory store, ` +
            'because that would reseed and overwrite your saved committee data. ' +
            'Check DATABASE_URL / your Neon dashboard, then restart.\x1b[0m',
        );
        throw err instanceof Error ? err : new Error(msg);
      }
    }
  }
  // Unreachable, but satisfies the type checker.
  throw new Error('[persistence] unreachable');
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
