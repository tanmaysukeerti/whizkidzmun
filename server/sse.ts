// Server-Sent Events: pushes the full committee snapshot to every connected
// screen whenever the store changes. One-directional (server → clients);
// clients mutate via the REST API, which then triggers a broadcast.

import type { Request, Response } from 'express';
import type { CommitteeState } from '../shared/types.ts';
import { snapshot, subscribe } from './store.ts';

const clients = new Set<Response>();

function send(res: Response, snap: CommitteeState): void {
  res.write(`data: ${JSON.stringify(snap)}\n\n`);
}

/** Wire the store's change stream to all connected SSE clients. Call once. */
export function initSse(): void {
  subscribe((snap) => {
    for (const res of clients) send(res, snap);
  });

  // Heartbeat comment keeps proxies/browsers from closing an idle connection.
  setInterval(() => {
    for (const res of clients) res.write(': ping\n\n');
  }, 25_000);
}

/** Express handler for GET /events — opens a long-lived SSE stream. */
export function handleSse(req: Request, res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');

  clients.add(res);
  // Push the current state immediately so a fresh screen is never blank.
  send(res, snapshot());

  req.on('close', () => {
    clients.delete(res);
  });
}
