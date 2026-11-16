// x-cmd/icon 的 Worker:把图标库挂在 po6.sh/icon 上。
//
// 路由(去掉挂载前缀 /icon 之后):
//   /                → 查询页(深链 /c/<cat> 也走这里,前端路由)
//   /manifest.json   → 图标清单 —— 静态资源,边缘直接发
//   /i/<cat>/<file>  → 图标原文件 —— 静态资源,边缘直接发
//   /api/icons.json?ids=a,b → { id: data URI },给 draw 那侧内嵌用
import { CATS, ID2FILE, LICENSE, BUILD } from './gen.js';
import { PAGE } from './page.js';

const MOUNT = '/icon';
const API_MAX = 300;

interface Env {
  ASSETS: Fetcher;
}

function html(body: string, base: string): Response {
  return new Response(body.replace('__ICON_BASE__/', base ? `${base}/` : '/'), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
}

function json(data: unknown, cache = 60): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${cache}`,
    },
  });
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname;
    let base = '';
    if (path === MOUNT || path.startsWith(`${MOUNT}/`)) {
      base = MOUNT;
      path = path.slice(MOUNT.length) || '/';
    }

    // 图标清单与图标文件是静态资源(public/icon/**),边缘直接发;
    // 这里的分支只是 workers.dev 直连时的兜底。
    if (path === '/manifest.json' || path.startsWith('/i/')) {
      const res = await env.ASSETS.fetch(new URL(`${base}${path}`, url.origin));
      if (res.status === 200) return res;
      return new Response('not found', { status: 404 });
    }

    // 给 draw 内嵌用:按 id 取 data URI
    if (path === '/api/icons.json') {
      const ids = (url.searchParams.get('ids') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, API_MAX);
      if (!ids.length) {
        return json({ error: `带 ids= 参数,如 /icon/api/icons.json?ids=infra:server,aws:ec2` }, 0);
      }
      const out: Record<string, string> = {};
      for (const id of ids) {
        const file = ID2FILE[id];
        if (!file) continue;
        const res = await env.ASSETS.fetch(new URL(`${base}/${file}`, url.origin));
        if (!res.ok) continue;
        const buf = new Uint8Array(await res.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const mime = file.endsWith('.png') ? 'image/png' : 'image/svg+xml';
        out[id] = `data:${mime};base64,${btoa(bin)}`;
      }
      return json(out, 300);
    }

    // 其余路径(/c/<cat> 之类的深链)都回查询页,前端自己路由
    return html(PAGE, base);
  },
};
