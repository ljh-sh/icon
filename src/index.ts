// x-cmd/icon 的 Worker:把图标库挂在 po6.sh/icon 与 x-cmd.com/iconbase 上。
//
// 同一个 Worker 挂在多个挂载点下 —— 挂载前缀从请求路径推断(见 MOUNTS),
// 静态资源只有一份(public/icon/**),各挂载点都从那儿取。
//
// 路由(去掉挂载前缀之后):
//   /                → 查询页(深链 /c/<cat> 也走这里,前端路由)
//   /index.json      → 索引:分类清单 + 每包多大 —— 客户端第一个请求
//   /manifest.*.json → 图标清单(按包:star / 每个分类一包)
//   /sprite.*.svg    → 图标符号(按包)
//   /i/<cat>/<file>  → 图标原文件 —— 静态资源,边缘直接发
//   /api/icons.json?ids=a,b → { id: data URI },给 draw 那侧内嵌用
import { CATS, ID2FILE, LICENSE, BUILD } from './gen.js';
import { PAGE } from './page.js';

// 静态资源在 public/icon/** 下的那个前缀 —— 所有挂载点都从这儿取
const ASSET_ROOT = '/icon';
const API_MAX = 300;

interface Env {
  ASSETS: Fetcher;
  /** 挂载点,逗号分隔 */
  MOUNTS?: string;
}

function html(body: string, base: string): Response {
  const page = body
    .replace('__ICON_BASE__/', base ? `${base}/` : '/')
    // 构建号填进去 —— 页面里就能知道该拉哪一版的包,索引和 star 可以并行拉
    .replace('__ICON_BUILD__', BUILD);
  return new Response(page, {
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
    // 挂载前缀:请求路径的第一段,得是已知的挂载点才算
    const mounts = (env.MOUNTS || ASSET_ROOT).split(',').map((s) => s.trim()).filter(Boolean);
    const base = mounts.find((m) => path === m || path.startsWith(`${m}/`)) || '';
    if (base) path = path.slice(base.length) || '/';

    // 图标文件是静态资源(public/icon/i/**),边缘直接发;
    // 这里的分支只是 workers.dev 直连时的兜底。
    if (path.startsWith('/i/')) {
      const res = await env.ASSETS.fetch(new URL(`${ASSET_ROOT}${path}`, url.origin));
      if (res.status === 200) return res;
      return new Response('not found', { status: 404 });
    }

    // 清单与 sprite 是静态资源,边缘直接发;这里是 workers.dev 直连时的兜底。
    // 图标分了包:index.json / manifest.<包>.json / sprite.<包>.svg
    if (/^\/(index\.json|manifest[^/]*\.json|sprite[^/]*\.svg)$/.test(path)) {
      const res = await env.ASSETS.fetch(new URL(`${ASSET_ROOT}${path}`, url.origin));
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
        return json({ error: `带 ids= 参数,如 ${ASSET_ROOT}/api/icons.json?ids=infra:server,aws:ec2` }, 0);
      }
      const out: Record<string, string> = {};
      for (const id of ids) {
        const file = ID2FILE[id];
        if (!file) continue;
        const res = await env.ASSETS.fetch(new URL(`${ASSET_ROOT}/${file}`, url.origin));
        if (!res.ok) continue;
        const buf = new Uint8Array(await res.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const mime = file.endsWith('.png') ? 'image/png' : 'image/svg+xml';
        out[id] = `data:${mime};base64,${btoa(bin)}`;
      }
      return json(out, 300);
    }

    // 老链接 /c/<cat> —— 分类不再是子页,重定向到首页并带上筛选条件
    const cm = path.match(/^\/c\/([a-z0-9-]+)/i);
    if (cm) {
      const to = new URL(url);
      to.pathname = (base || '') + '/';
      to.search = `?cat=${encodeURIComponent(cm[1])}`;
      to.hash = '';
      return Response.redirect(to.toString(), 302);
    }

    // 其余路径都回查询页
    return html(PAGE, base);
  },
};
