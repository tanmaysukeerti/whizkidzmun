<div align="center">
<h1>WHIZKIDZ.MUN™</h1>
<p><strong>A live-synced Model UN dais &amp; projector control system.</strong></p>
<p><em>System Architect — Tanmay Sukeerti M</em></p>
</div>

Roll call, the General Speakers List, round-robin, moderated/unmoderated caucuses,
resolution voting, and a crisis override — all driven from one shared, real-time
committee state. The chair controls a session from any device and every screen
(including the projector) updates instantly.

## Architecture

This is a **fullstack** app:

- **Frontend** — React 19 + Vite + Tailwind (the `src/` views).
- **Backend** — an Express server (`server/`) that owns the authoritative
  committee state, exposes a REST API, and streams changes to every connected
  client over **Server-Sent Events** (`/events`).
- **Persistence** — **Postgres** (via `DATABASE_URL`). Committee/session data is
  stored as JSONB documents. If no `DATABASE_URL` is set, an in-memory fallback
  is used so the app still runs (state resets on restart).
- **Live timers** — timers are stored as `endsAt` descriptors, not per-second
  ticks, so the projector and the chair's controls always agree with almost no
  network traffic.

One Node process serves both the API and the web app (Vite runs as Express
middleware in dev; static `dist/` in production).

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Recommended) Configure Postgres. Copy `.env.example` to `.env` and set
   `DATABASE_URL` to your Postgres/Supabase connection string. Tables are created
   and seeded automatically on first start. *You can skip this to try the app
   immediately with the in-memory store.*
3. Start the dev server (API + web app + HMR on one port):
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

Open the same URL in a second tab or on another device to watch state sync live.

## Login

The dais is gated by a simple hardcoded login (single-committee tool — no user
database). Default credentials:

| Operator ID | Access Key |
| ----------- | ---------- |
| `chair`     | `whizkidz` |

Change them in [src/auth/AuthContext.tsx](src/auth/AuthContext.tsx).

## Projector / view-only mode

Open **`/?role=projector`** (there's an "Projector" link in the header that opens
it in a new tab) on the projector or any second screen. It shows the live
committee feed — following whatever view the chair is on — with **all controls
hidden and no login required**. Actions are hard no-ops in this mode, so a
projector screen can never change committee state.

## Production build

```bash
npm run build   # builds the frontend into dist/
npm start       # NODE_ENV=production, serves dist/ + API on PORT (default 3000)
```

## Deploy to Render (free)

The app runs as a single persistent Node process, so the instant SSE live-sync
works unchanged. A [`render.yaml`](render.yaml) blueprint is included.

**1. Get a free Postgres.** Create a project at [neon.tech](https://neon.tech)
(or [supabase.com](https://supabase.com)) and copy the connection string, e.g.
`postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`. SSL is enabled
automatically for non-localhost hosts.

**2. Push this repo to GitHub.**
```bash
git init && git add -A && git commit -m "WHIZKIDZ.MUN"
git branch -M main
git remote add origin https://github.com/<you>/whizkidz-mun.git
git push -u origin main
```

**3. Create the service on Render.**
- In the [Render dashboard](https://dashboard.render.com) → **New → Blueprint**,
  pick your repo. Render reads `render.yaml` (free web service, build =
  `npm install && npm run build`, start = `npm start`).
- When prompted, set **`DATABASE_URL`** to your Neon/Supabase string.
- Deploy. Your app is live at `https://<name>.onrender.com`; the projector view
  is `https://<name>.onrender.com/?role=projector`.

Notes:
- **Free instances sleep after ~15 min idle** — the first request after a break
  takes ~30–50 s to wake, then it's fast. Open the app a minute before session.
- Without `DATABASE_URL` the app still runs, but state is in-memory and resets on
  each sleep/restart — so set it.
- `tsx`, `tailwindcss`, and `cross-env` are intentionally in `dependencies` so the
  build/start succeed even when the host installs with `NODE_ENV=production`.

## API surface

All under `/api`. Every mutation persists and broadcasts the new snapshot.

- `GET /api/state` — full committee snapshot
- `GET /events` — SSE stream of snapshots
- `POST /api/view` `{ view }` — shared active view (projector follows chair)
- Roll call: `POST /api/delegates`, `POST /api/delegates/:id/cycle`, `DELETE /api/delegates/:id`, `POST /api/delegates/reset`
- GSL: `POST /api/gsl/yield`, `POST /api/gsl/queue`, `DELETE /api/gsl/queue/:id`
- Round robin: `POST /api/round-robin/next`, `POST /api/round-robin/prev`
- Caucus: `POST /api/caucus/mode`, `POST /api/caucus/topic`, `POST /api/caucus/next`, `POST /api/caucus/queue`
- Voting: `POST /api/voting/active`, `POST /api/voting/vote`, `POST /api/voting/reset`, `POST /api/voting/papers`, `DELETE /api/voting/papers/:id`
- Crisis: `POST /api/crisis`
- Timers: `POST /api/timer/:key` `{ action, value }` — `key` ∈ `gsl | roundRobin | caucusTotal | caucusSpeaker | crisis`
