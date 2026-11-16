// x-cmd/icon 的 Worker:把图标库挂在 po6.sh/icon 上。
//
// 路由(去掉挂载前缀 /icon 之后):
//   /                → 查询页(深链 /c/<cat> 也走这里,前端路由)
//   /style.css       → 样式
//   /app.js          → 前端脚本
//   /manifest.json   → 图标清单(元数据,给页面用)
//   /api/icons.json  → { id: data URI } 给 draw 那侧内嵌用
//   /i/<cat>/<file>  → 图标原文件
import { ICONS, CATS, BLOBS } from './gen.js';
import { PAGE } from './page.js';

const MOUNT = '/icon';

const MIME: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
};

const metaByFile = new Map(ICONS.map((m) => [m.file, m]));

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function html(body: string, base: string, status = 200): Response {
  return new Response(body.replace('__ICON_BASE__/', base ? `${base}/` : '/'), {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
}

function json(data: unknown, cache = 300): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${cache}`,
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname;
    let base = '';
    if (path === MOUNT || path.startsWith(`${MOUNT}/`)) {
      base = MOUNT;
      path = path.slice(MOUNT.length) || '/';
    }

    if (path === '/' || path === '/index.html') return html(PAGE, base);

    if (path === '/manifest.json') return json({ cats: CATS, icons: ICONS });

    if (path === '/api/icons.json') {
      const map: Record<string, string> = {};
      for (const m of ICONS) {
        map[m.id] = `data:${m.mime};base64,${BLOBS[m.file]}`;
      }
      return json(map);
    }

    if (path.startsWith('/i/')) {
      const file = `icons/${path.slice(3)}`;
      const blob = BLOBS[file];
      if (!blob) return new Response('not found', { status: 404 });
      const meta = metaByFile.get(file);
      const ext = file.split('.').pop() || '';
      return new Response(b64ToBytes(blob), {
        headers: {
          'content-type': MIME[ext] || 'application/octet-stream',
          'cache-control': 'public, max-age=3600',
          'x-icon-id': meta?.id || '',
        },
      });
    }

    // 其余路径(/c/<cat> 之类的深链)都回查询页,前端自己路由
    return html(PAGE, base);
  },
};
