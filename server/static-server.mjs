// Dependency-free static server so the single-player prototype can run even before npm install.
// Multiplayer requires `npm install` and `npm start` (Express + Socket.IO).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/socket.io/socket.io.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    res.end('/* Multiplayer is disabled in static-only mode. Run `npm install` and `npm start` for Socket.IO. */');
    return;
  }
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'tiny-teamwork-static', multiplayer: false }));
    return;
  }
  let requested;
  try { requested = decodeURIComponent(url.pathname); } catch { requested = '/'; }
  if (requested === '/') requested = '/index.html';
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root + path.sep) && target !== path.join(root, 'index.html')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(target, (err, bytes) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(bytes);
  });
});
server.listen(PORT, () => console.log(`Tiny Teamwork static-only server at http://localhost:${PORT} (no multiplayer)`));
