// 本地预览:起个静态服务器,伺服 dist/(SPA 回退到 index.html)。
// 用法:node scripts/serve.mjs [端口]   默认 8787
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const PORT = Number(process.argv[2] || 8787);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(DIST)) file = join(DIST, 'index.html');
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  const body = readFileSync(file);
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(PORT, () => console.log(`icon 预览:http://localhost:${PORT}/`));
