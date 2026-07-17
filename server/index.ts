// Fullstack entrypoint. One process serves both the API and the web app:
//   • dev  — Vite runs in middleware mode (HMR intact) behind Express.
//   • prod — Express serves the built assets from dist/.
// The API (/api) and live-sync stream (/events) are registered first so they
// always win over the SPA fallback.

import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPersistence } from './persistence.ts';
import { api } from './routes.ts';
import { handleSse, initSse } from './sse.ts';
import { initStore } from './store.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

async function main() {
  // 1. Storage + authoritative state
  const persistence = await createPersistence();
  await initStore(persistence);
  initSse();

  // 2. HTTP app
  const app = express();
  app.use(express.json());

  // Live-sync stream + REST API (must precede the SPA fallback).
  app.get('/events', handleSse);
  app.use('/api', api);

  // 3. Frontend
  if (isProd) {
    const dist = path.resolve(root, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.resolve(dist, 'index.html')));
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root,
      appType: 'custom',
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
    app.use(/.*/, async (req, res, next) => {
      try {
        const template = await fs.readFile(path.resolve(root, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(port, () => {
    console.log(
      `\x1b[36m[whizkidz.mun] ${isProd ? 'production' : 'dev'} server on ` +
        `http://localhost:${port}\x1b[0m`,
    );
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
