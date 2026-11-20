// 运行时合成 —— URL 即配方,把库里的图标拼成新的(badge / 框内 / 图文 / 叠加)。
// 这是 issues #12(文本型、badge 型、图文、叠加)与 #8(全/半包围)的运行时版:
// 构建期 compose(symbols/recipes.tsv)管「预合成进库」,这里管「按需即时合成」。
//
// 消费方:
//   /draw/<kind>?<params>            浏览器与 <img> 直接引用
//   /api/icons.json?ids=<id>?<mods>  x-cmd/draw 的架构图(拉 data URI 内嵌)
//   /editor                          可视化编辑器,产出上面两种引用
//
// 两条规矩:
//   1. 产出必须是自包含单文件 SVG —— 不引任何外部资源(data URI 内嵌时外部引用
//      解析不了,见 570c94af 的教训);
//   2. 一律在 24 系坐标里摆(与库里的构图规范同网格);文字交给查看端的字体解析,
//      不嵌字体文件(边缘上没有)。
export class DrawError extends Error {}

/** 一个图标源文件:剥掉 <svg> 外壳后的内容 + 几何信息 */
export interface IconSrc {
  body: string;
  /** viewBox 的宽高 */
  w: number;
  h: number;
  /** viewBox 的偏移(绝大多数是 0 0) */
  vx: number;
  vy: number;
  /** 内容区(24 系坐标)—— 框型/底座图标才有,见 build.mjs 的 data-inner */
  inner?: { x: number; y: number; w: number; h: number };
  /** 深色框(黑板 / 终端)—— 框内放文字时默认配浅色字 */
  dark?: boolean;
}

/** 解析图标 SVG 文本;不是 SVG 返回 null */
export function parseIconSvg(text: string): IconSrc | null {
  const m = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const root = text.match(/<svg[^>]*>/)?.[0] || '';
  if (!m || !root) return null;
  const vb = root.match(/viewBox="([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)"/);
  const innerRaw = root.match(/data-inner="([-\d. ]+)"/)?.[1];
  const t = innerRaw?.trim().split(/\s+/).map(Number);
  return {
    body: m[1].trim(),
    w: vb ? +vb[3] : 24,
    h: vb ? +vb[4] : 24,
    vx: vb ? +vb[1] : 0,
    vy: vb ? +vb[2] : 0,
    inner: t && t.length === 4 ? { x: t[0], y: t[1], w: t[2], h: t[3] } : undefined,
    dark: /data-dark="1"/.test(root),
  };
}

export type GetIcon = (id: string) => Promise<IconSrc | null>;

// ---------------------------------------------------------------- 共用工具

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif`;

// 字宽表 —— 数值抄自 x-cmd/draw 的 INTER_WIDTHS(Inter 字体),系统字体栈下够用:
// 只影响画布多宽、角标长不长成胶囊,不影响居中(anchor 负责)。
const WIDTHS: Readonly<Record<string, number>> = {
  ' ': 0.281, '!': 0.288, '"': 0.466, '#': 0.633, '$': 0.642, '%': 0.982, '&': 0.644,
  "'": 0.3, '(': 0.365, ')': 0.365, '*': 0.501, '+': 0.662, ',': 0.288, '-': 0.46,
  '.': 0.288, '/': 0.36, '0': 0.631, '1': 0.407, '2': 0.61, '3': 0.618, '4': 0.646,
  '5': 0.593, '6': 0.62, '7': 0.566, '8': 0.619, '9': 0.62, ':': 0.288, ';': 0.302,
  '<': 0.662, '=': 0.662, '>': 0.662, '?': 0.511, '@': 0.966, A: 0.69, B: 0.654,
  C: 0.73, D: 0.722, E: 0.601, F: 0.59, G: 0.746, H: 0.743, I: 0.269, J: 0.571,
  K: 0.672, L: 0.565, M: 0.903, N: 0.753, O: 0.765, P: 0.639, Q: 0.765, R: 0.644,
  S: 0.642, T: 0.646, U: 0.744, V: 0.69, W: 0.985, X: 0.682, Y: 0.679, Z: 0.629,
  '[': 0.365, '\\': 0.36, ']': 0.365, '^': 0.471, _: 0.456, '`': 0.323, a: 0.562,
  b: 0.612, c: 0.571, d: 0.612, e: 0.583, f: 0.37, g: 0.613, h: 0.591, i: 0.242,
  j: 0.242, k: 0.549, l: 0.242, m: 0.876, n: 0.591, o: 0.6, p: 0.612, q: 0.612,
  r: 0.376, s: 0.528, t: 0.327, u: 0.591, v: 0.562, w: 0.818, x: 0.546, y: 0.562,
  z: 0.552, '{': 0.426, '|': 0.333, '}': 0.426, '~': 0.662, '¥': 0.55, '©': 0.914,
  '°': 0.456, '±': 0.662, '·': 0.288, '×': 0.662, '÷': 0.662, '–': 0.5, '—': 1.0,
  '…': 0.864, '™': 0.611,
};

/** 估一段文字的宽 —— CJK 与未知字符按 1em(保守,宁可画布松点) */
export function textW(s: string, fs: number): number {
  let em = 0;
  for (const ch of s) em += ch.charCodeAt(0) > 0x2e80 ? 1 : WIDTHS[ch] ?? 1;
  return em * fs;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const r2 = (n: number) => Math.round(n * 100) / 100;

interface Box { x: number; y: number; w: number; h: number }
const FULL: Box = { x: 0, y: 0, w: 24, h: 24 };

/** 把任意 viewBox 的图标 contain 居中放进目标框(厂商图标 80×80 也能进 24 系) */
function fitOf(icon: IconSrc, box: Box) {
  const s = Math.min(box.w / icon.w, box.h / icon.h);
  return { s, x: box.x + (box.w - icon.w * s) / 2 - icon.vx * s, y: box.y + (box.h - icon.h * s) / 2 - icon.vy * s };
}
function iconNode(icon: IconSrc, box: Box): string {
  const { s, x, y } = fitOf(icon, box);
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${Math.round(s * 10000) / 10000})">${icon.body}</g>`;
}

// ---------------------------------------------------------------- 墨迹扫描
// 量一枚图标实际画到哪儿:文字贴墨迹摆,而不是贴 contain 盒 ——
// 图标自带的 viewBox 内边距(disk-array 上下各留 4.5)不该变成「字离图很远」。
// 只认平铺的 rect/circle/ellipse/line/poly*/path;嵌套 transform、弧参数粘连这类
// 解析不动的一律回 null,调用方退回整盒 —— 宁可松,不能错。

const PATH_TOK = /[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

function pathInk(d: string, eat: (x: number, y: number) => void): boolean {
  const t = d.match(PATH_TOK);
  if (!t) return true;
  let i = 0;
  const n = () => {
    const v = Number(t[i++]);
    if (!Number.isFinite(v)) throw new Error('nan');
    return v;
  };
  let cx = 0, cy = 0, mx = 0, my = 0, qx = 0, qy = 0, qSet = false;
  const reflect = () => (qSet ? { x: 2 * cx - qx, y: 2 * cy - qy } : { x: cx, y: cy });
  try {
    while (i < t.length) {
      const raw = t[i++];
      if (!/[a-zA-Z]/.test(raw)) return false; // 段首必须是命令字母
      let K = raw.toUpperCase();
      const rel = K !== raw;
      if (K === 'Z') { cx = mx; cy = my; qSet = false; continue; }
      const arity = ({ M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 } as const)[K as 'M'];
      if (!arity) return false;
      for (;;) { // 同一字母后跟多组参数 = 隐式重复(M 的后续组按 L 算)
        if (K === 'A') {
          const rx = n(), ry = n(), _rot = n(), _laf = n(), _sf = n();
          const dx = rel ? cx + n() : n(), dy = rel ? cy + n() : n();
          const r = Math.max(Math.abs(rx), Math.abs(ry));
          for (const [px_, py_] of [[cx, cy], [dx, dy]]) { eat(px_ - r, py_ - r); eat(px_ + r, py_ + r); }
          cx = dx; cy = dy; qSet = false;
        } else if (K === 'H') {
          cx = rel ? cx + n() : n(); eat(cx, cy); qSet = false;
        } else if (K === 'V') {
          cy = rel ? cy + n() : n(); eat(cx, cy); qSet = false;
        } else {
          const g: number[] = [];
          for (let j = 0; j < arity; j++) g.push(n());
          const X = (k: number) => (rel ? cx + g[k] : g[k]);
          const Y = (k: number) => (rel ? cy + g[k] : g[k]);
          if (K === 'M') { mx = X(0); my = Y(0); cx = mx; cy = my; eat(cx, cy); qSet = false; }
          else if (K === 'L') { cx = X(0); cy = Y(0); eat(cx, cy); qSet = false; }
          else if (K === 'C') { eat(X(0), Y(0)); eat(X(2), Y(2)); cx = X(4); cy = Y(4); qx = X(2); qy = Y(2); qSet = true; eat(cx, cy); }
          else if (K === 'S') { const c0 = reflect(); eat(c0.x, c0.y); eat(X(0), Y(0)); cx = X(2); cy = Y(2); qx = X(0); qy = Y(1); qSet = true; eat(cx, cy); }
          else if (K === 'Q') { eat(X(0), Y(0)); cx = X(2); cy = Y(3); qx = X(0); qy = Y(1); qSet = true; eat(cx, cy); }
          else if (K === 'T') { const c0 = reflect(); eat(c0.x, c0.y); cx = X(0); cy = Y(1); qx = c0.x; qy = c0.y; qSet = true; eat(cx, cy); }
        }
        if (i >= t.length || /[a-zA-Z]/.test(t[i])) break;
        if (K === 'M') K = 'L'; // 隐式重复降级
      }
    }
  } catch {
    return false;
  }
  return true;
}

const INK_EL = /<(rect|circle|ellipse|line|polyline|polygon|path)\b([^>]*)>/gi;
function numAttr(a: string, k: string, def = 0): number {
  const v = a.match(new RegExp('\\b' + k + '\\s*=\\s*"\\s*(-?[\\d.eE+]+)\\s*"'));
  const f = v ? Number(v[1]) : def;
  return Number.isFinite(f) ? f : def;
}
function strAttr(a: string, k: string): string | null {
  return a.match(new RegExp('\\b' + k + '\\s*=\\s*"([^"]*)"'))?.[1] ?? null;
}

/** 图标墨迹的包络盒(图标自身坐标);量不出返回 null */
function inkOf(icon: IconSrc): Box | null {
  if (/<(g|text|image|use|foreignObject)\b/i.test(icon.body)) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const eat = (x: number, y: number) => {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  };
  for (const m of icon.body.matchAll(INK_EL)) {
    const el = m[1].toLowerCase();
    const a = m[2];
    if (el === 'rect') { const x = numAttr(a, 'x'), y = numAttr(a, 'y'); eat(x, y); eat(x + numAttr(a, 'width'), y + numAttr(a, 'height')); }
    else if (el === 'circle') { const r = numAttr(a, 'r'); eat(numAttr(a, 'cx') - r, numAttr(a, 'cy') - r); eat(numAttr(a, 'cx') + r, numAttr(a, 'cy') + r); }
    else if (el === 'ellipse') { const rx = numAttr(a, 'rx'), ry = numAttr(a, 'ry'); eat(numAttr(a, 'cx') - rx, numAttr(a, 'cy') - ry); eat(numAttr(a, 'cx') + rx, numAttr(a, 'cy') + ry); }
    else if (el === 'line') { eat(numAttr(a, 'x1'), numAttr(a, 'y1')); eat(numAttr(a, 'x2'), numAttr(a, 'y2')); }
    else if (el === 'polygon' || el === 'polyline') {
      const pts = strAttr(a, 'points')?.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) || [];
      for (let j = 0; j + 1 < pts.length; j += 2) eat(+pts[j], +pts[j + 1]);
    } else {
      const d = strAttr(a, 'd');
      if (!d || !pathInk(d, eat)) return null;
    }
  }
  if (!(x1 > x0 && y1 > y0)) return null;
  // 出 viewBox 一点是描边/圆整的正常损耗,出太多 = 量错了,退回整盒
  const SL = 2.5;
  if (x0 < icon.vx - SL || y0 < icon.vy - SL || x1 > icon.vx + icon.w + SL || y1 > icon.vy + icon.h + SL) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** 墨迹放进目标盒后的纵向锚点(中线/底边);量不出退回盒本身 */
function inkY(icon: IconSrc, box: Box): { cy: number; bottom: number } {
  const f = fitOf(icon, box);
  const ink = inkOf(icon);
  if (!ink) return { cy: f.y + (icon.vy + icon.h / 2) * f.s, bottom: f.y + (icon.vy + icon.h) * f.s };
  return {
    cy: Math.min(box.y + box.h * 0.8, Math.max(box.y + box.h * 0.2, f.y + (ink.y + ink.h / 2) * f.s)),
    bottom: Math.min(box.y + box.h, f.y + (ink.y + ink.h) * f.s),
  };
}

function textEl(x: number, y: number, fs: number, s: string, fill: string, anchor = 'middle', weight = 400): string {
  return `<text x="${r2(x)}" y="${r2(y)}" font-size="${r2(fs)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" dy="0.35em">${esc(s)}</text>`;
}

function svgDoc(w: number, h: number, body: string, px: number | null, label: string): string {
  const W = px == null ? r2(w) : r2((w * px) / h);
  const H = px == null ? r2(h) : r2(px);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${W}" height="${H}" ` +
    `font-family="${FONT}" role="img" aria-label="${esc(label)}">${body}</svg>`
  );
}

// 参数的清洗:颜色与数值都不许随手拼进属性(esc 挡住了注入,这里再挡一层怪值)
const COLOR_RE = /^(?:#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|rgba?\([\d.,% ]+\))$/;
function color(p: URLSearchParams, key: string, def: string): string {
  const v = p.get(key);
  if (!v) return def;
  if (!COLOR_RE.test(v)) throw new DrawError(`${key} 不是合法颜色:${v}(支持 #hex / 颜色名 / rgba())`);
  return v;
}
function num(p: URLSearchParams, key: string, def: number, min: number, max: number): number {
  const v = p.get(key);
  if (v == null || v === '') return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new DrawError(`${key} 不是数字:${v}`);
  return Math.min(max, Math.max(min, n));
}
function pxOf(p: URLSearchParams, def: number | null): number | null {
  const v = p.get('px');
  if (v == null || v === '') return def;
  return num(p, 'px', def ?? 24, 8, 512);
}

async function needIcon(p: URLSearchParams, getIcon: GetIcon): Promise<{ icon: IconSrc; id: string }> {
  const id = p.get('icon') || '';
  if (!id) throw new DrawError('缺 icon 参数,如 /draw/badge?icon=infra:disk&text=x2');
  const icon = await getIcon(id);
  if (!icon) throw new DrawError(`找不到图标 ${id} —— 去首页查 id:/`);
  return { icon, id };
}

// ---------------------------------------------------------------- 各 kind

export const KINDS = ['badge', 'in', 'icon-text', 'text-icon', 'icon-text-v', 'stack'] as const;

// 角标圆心(24 系)锚在画布角上:圆心距角 scale 后的 (r + 0.6),放大不出界
const POS_ALIAS: Record<string, string> = {
  ru: 'ru', rl: 'rl', lu: 'lu', ll: 'll',
  'right-upper': 'ru', 'right-lower': 'rl', 'left-upper': 'lu', 'left-lower': 'll',
};

function posOf(p: URLSearchParams): string {
  const v = p.get('pos') || 'rl'; // 构图规范:右下角留给计数徽标
  const pos = POS_ALIAS[v];
  if (!pos) throw new DrawError(`pos 只认 ru/rl/lu/ll(或 right-upper 这类长写),收到:${v}`);
  return pos;
}

const CORNER_ORDER = ['lu', 'ru', 'll', 'rl'] as const;

interface BadgeSpec { pos: string; text: string }
interface BadgeOpts { bubble: boolean; bg: string; fg: string; scale: number; fs: number }

/** 收集角点键(lu=/ru=/ll=/rl=,含长写)——「在某角挂一枚角标」的统一修饰语法 */
function cornerBadges(p: URLSearchParams): BadgeSpec[] {
  const byPos: Partial<Record<string, string>> = {};
  for (const k of [...p.keys()]) {
    const pos = POS_ALIAS[k];
    if (!pos) continue;
    for (const v of p.getAll(k)) {
      const text = v.slice(0, 12);
      if (!text) throw new DrawError(`${k}= 的角标文字是空的`);
      if (pos in byPos) throw new DrawError(`${pos} 角已有角标 —— 一角一枚,换一个角`);
      byPos[pos] = text;
    }
  }
  // 固定角序输出,URL 与产物确定
  return CORNER_ORDER.filter((c) => c in byPos).map((c) => ({ pos: c, text: byPos[c]! }));
}

/** 角标样式:pre 为空 = /draw/badge 本尊;带 b. 前缀 = 挂在长条/叠加里的角标,避开宿主自己的 bg/fg/fs */
function badgeOpts(p: URLSearchParams, pre: string): BadgeOpts {
  const style = p.get(pre + 'style') || 'disc';
  if (style !== 'disc' && style !== 'bubble') throw new DrawError(`${pre}style 只认 disc / bubble,收到:${style}`);
  const bubble = style === 'bubble';
  const scale = num(p, pre + 'scale', 1, 0.5, 2);
  return {
    bubble,
    // 站点主色的深一档,白字压得住;气泡反过来:白底深字
    bg: color(p, pre + 'bg', bubble ? '#ffffff' : '#ea580c'),
    fg: color(p, pre + 'fg', bubble ? '#1e293b' : '#ffffff'),
    scale,
    // scale:角标整体大小;fs:字号(24 系)—— 缺省随 scale,只动一个即可整体缩放
    fs: num(p, pre + 'fs', r2(4.6 * scale), 2.5, 9),
  };
}

/** 画一枚角标(24 系几何,锚画布角)—— badge 本尊与嵌进小图标盒共用 */
function drawBadge(b: BadgeSpec, o: BadgeOpts): string {
  const { pos, text } = b;
  const { bubble, bg, fg, scale, fs } = o;
  const tw = textW(text, fs);
  if (bubble) {
    // 气泡:白底圆角矩形 + 尾巴指向图标中心;画在角上,占的面积比圆标大
    const bh = 9 * scale;
    const bw = Math.max(9 * scale, tw + 3.2 * scale);
    const x = pos.includes('r') ? 23.6 - bw : 0.4;
    const y = pos === 'ru' || pos === 'lu' ? 0.4 : 23.6 - bh;
    const top = pos === 'ru' || pos === 'lu';
    // 尾巴:根在气泡靠内侧的边上,尖往图标中心指
    const ex = x + bw * 0.32 + 1.2 * scale;
    const ey = top ? y + bh : y;
    const dx = pos.includes('r') ? -1 : 1;
    const dy = top ? 1 : -1;
    const tail = `<path d="M${r2(ex - 1.2 * scale)} ${r2(ey)}L${r2(ex + 1.2 * scale)} ${r2(ey)}L${r2(ex + dx * 1.4 * scale)} ${r2(ey + dy * 2.8 * scale)}Z" fill="${bg}"/>`;
    // 接缝:把气泡边框在尾巴根部那一段盖掉,让尾把和气泡连成一体
    const seam = `<rect x="${r2(ex - 1)}" y="${r2(top ? y + bh - 0.55 : y - 0.55)}" width="2" height="1.1" fill="${bg}"/>`;
    return (
      `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(bw)}" height="${r2(bh)}" rx="${r2(2.4 * scale)}" fill="${bg}" stroke="#cbd5e1" stroke-width="${r2(Math.max(0.4, 0.5 * scale))}"/>` +
      seam + tail + textEl(x + bw / 2, y + bh / 2, fs, text, fg, 'middle', 600)
    );
  }
  // 圆标:文字放不下就自动长成胶囊(stadium);锚在画布角上,放大不出界
  const r = 4.6 * scale;
  const off = r + 0.6;
  const cx = pos.includes('r') ? 24 - off : off;
  const cy = pos === 'ru' || pos === 'lu' ? off : 24 - off;
  const stroke = r2(Math.max(0.9, 1.2 * scale));
  if (tw <= r * 2 - 2.6 * scale) {
    return (
      `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${bg}" stroke="#ffffff" stroke-width="${stroke}" paint-order="stroke"/>` +
      textEl(cx, cy, fs, text, fg, 'middle', 700)
    );
  }
  const bw = tw + 3.4 * scale;
  const x = pos.includes('r') ? 23.4 - bw : 0.6;
  const y = pos === 'ru' || pos === 'lu' ? 0.6 : 23.4 - r * 2;
  return (
    `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(bw)}" height="${r2(r * 2)}" rx="${r2(r)}" fill="${bg}" stroke="#ffffff" stroke-width="${stroke}" paint-order="stroke"/>` +
    textEl(x + bw / 2, y + r, fs, text, fg, 'middle', 700)
  );
}

/** 把角标按比例缩进宿主图标盒:角标恒为图标的 ~19%,几何零重算 */
function badgeOnBox(box: Box, b: BadgeSpec, o: BadgeOpts): string {
  const side = Math.min(box.w, box.h); // contain 后的图标是盒内最大方形
  const x = box.x + (box.w - side) / 2;
  const y = box.y + (box.h - side) / 2;
  const s = Math.round((side / 24) * 10000) / 10000;
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${s})">${drawBadge(b, o)}</g>`;
}

/** badge —— 在已有图标上叠角标(计数 / 状态 / 气泡),可多角:rl=x2&lu=新 */
async function badge(p: URLSearchParams, getIcon: GetIcon): Promise<string> {
  const { icon, id } = await needIcon(p, getIcon);
  const legacy = p.has('pos') || p.has('text');
  const badges = cornerBadges(p);
  if (legacy && badges.length) throw new DrawError('pos=/text= 是单角标旧写法,别和 rl=/lu= 角点键混用');
  if (legacy) {
    const text = (p.get('text') || '').slice(0, 12);
    if (!text) throw new DrawError('缺 text(角标文字),如 /draw/badge?icon=infra:disk-array&rl=x2');
    badges.push({ pos: posOf(p), text });
  }
  if (!badges.length) throw new DrawError('缺角标:至少一个角点键,如 /draw/badge?icon=infra:disk-array&rl=x2(多角:&rl=x2&lu=新)');
  const o = badgeOpts(p, '');
  const layer = badges.map((b) => drawBadge(b, o)).join('');
  return svgDoc(24, 24, iconNode(icon, FULL) + layer, pxOf(p, null), `${id} ${badges.map((b) => b.text).join(' ')}`);
}

/** in —— 框内放内容(#8 全/半包围的运行时版):内容是图标或文字(支持 \n 换行) */
async function inFrame(p: URLSearchParams, getIcon: GetIcon): Promise<string> {
  const { icon, id } = await needIcon(p, getIcon);
  if (!icon.inner) {
    throw new DrawError(`${id} 不是框型/底座图标(没声明内容区)—— 框在 frame: 分类,底座在 base:;用 /editor 挑`);
  }
  const inner = icon.inner;
  const content = p.get('in');
  const text = (p.get('text') || '').replace(/\r/g, '').slice(0, 40);
  if (!content && !text) {
    throw new DrawError('缺内容:in=<图标id> 或 text=<文字>,如 /draw/in?icon=frame:whiteboard&in=common:atom');
  }
  if (content && text) throw new DrawError('in= 与 text= 只能给一个');
  let layer: string;
  if (content) {
    const c = await getIcon(content);
    if (!c) throw new DrawError(`找不到图标 ${content} —— 去首页查 id:/`);
    layer = iconNode(c, inner);
  } else {
    // 多行:每行各自水平居中,整块垂直居中;字号按「最长行宽 + 行数」自适应收缩
    const lines = text.split('\n').filter((s, i, a) => s.trim() || (i > 0 && i < a.length - 1));
    const lh = 1.15;
    const emMax = Math.max(...lines.map((s) => textW(s, 1)), 0.001);
    const fs = Math.min(inner.w / emMax, (inner.h * 0.9) / (1 + lh * (lines.length - 1)));
    const cy = inner.y + inner.h / 2;
    const fg = color(p, 'fg', icon.dark ? '#f8fafc' : '#1e293b'); // 深色框默认浅色字,fg= 可覆盖
    layer = lines
      .map((s, i) => (s.trim() ? textEl(inner.x + inner.w / 2, cy + (i - (lines.length - 1) / 2) * fs * lh, fs, s, fg, 'middle', 600) : ''))
      .join('');
  }
  return svgDoc(24, 24, iconNode(icon, FULL) + layer, pxOf(p, null), `${id}:${content || text}`);
}

/** icon-text / text-icon —— 长条:图 + 文字(哪个在左由 textFirst 决定),文字可 \n 换行 */
async function bar(p: URLSearchParams, getIcon: GetIcon, textFirst: boolean): Promise<string> {
  const { icon, id } = await needIcon(p, getIcon);
  const text = (p.get('text') || '').replace(/\r/g, '').slice(0, 80);
  if (!text) throw new DrawError(`缺 text,如 /draw/${textFirst ? 'text-icon' : 'icon-text'}?icon=${id || 'infra:server'}&text=API`);
  const lines = text.split('\n').filter((s, i, a) => s.trim() || (i > 0 && i < a.length - 1));
  const lh = 1.15;
  // 多行时默认字号按行数收缩(fs= 可覆盖),整块在 24 高里垂直居中
  const fsAuto = lines.length > 1 ? Math.min(10, 16.5 / (1 + lh * (lines.length - 1))) : 10;
  const fs = num(p, 'fs', r2(fsAuto), 4, 14);
  const tw = Math.max(...lines.map((s) => textW(s, fs)), 0.001);
  const W = 25 + tw; // 2 边距 + 最长行文字 + 3 间隔 + 18 图标 + 2 边距
  const bgV = p.get('bg');
  const bg = bgV ? `<rect x="0" y="0" width="${r2(W)}" height="24" rx="${num(p, 'r', 5, 0, 12)}" fill="${color(p, 'bg', '#f1f5f9')}"/>` : '';
  const iconBox: Box = textFirst ? { x: W - 20, y: 3, w: 18, h: 18 } : { x: 2, y: 3, w: 18, h: 18 };
  const tx = textFirst ? 2 : 23;
  const tcy = inkY(icon, iconBox).cy; // 文字跟图标墨迹垂直对齐,而非 contain 盒
  const fg = color(p, 'fg', '#1e293b');
  const texts = lines
    .map((s, i) => (s.trim() ? textEl(tx, tcy + (i - (lines.length - 1) / 2) * fs * lh, fs, s, fg, 'start', 600) : ''))
    .join('');
  // 角点键在这里 = 给条里的图标戴一枚角标(样式走 b. 前缀,避开宿主的 bg/fg/fs)
  const bcol = cornerBadges(p);
  if (bcol.length > 1) throw new DrawError('长条上的角标最多一枚 —— 图标小,双角挤');
  const badgeG = bcol.length ? badgeOnBox(iconBox, bcol[0], badgeOpts(p, 'b.')) : '';
  const body = bg + texts + iconNode(icon, iconBox) + badgeG;
  return svgDoc(W, 24, body, pxOf(p, 48), `${id} ${text}`);
}

/** icon-text-v —— 方型:上图下文,文字可 \n 换行(高度按行数与墨迹生长) */
async function barV(p: URLSearchParams, getIcon: GetIcon): Promise<string> {
  const { icon, id } = await needIcon(p, getIcon);
  const text = (p.get('text') || '').replace(/\r/g, '').slice(0, 80);
  if (!text) throw new DrawError(`缺 text,如 /draw/icon-text-v?icon=${id || 'frame:door'}&text=入口`);
  const lines = text.split('\n').filter((s, i, a) => s.trim() || (i > 0 && i < a.length - 1));
  const emMax = Math.max(...lines.map((s) => textW(s, 1)), 0.001);
  const fs = Math.min(num(p, 'fs', 5.5, 2.5, 8), 22 / emMax); // 装不下就缩字
  const iconBox: Box = { x: 3, y: 1, w: 18, h: 18 };
  // 文字贴图标墨迹摆:图标自带的 viewBox 内边距不再变成「字离图很远」;
  // 小墨迹图标(点/短线)保住盒的 75% 下沿 —— 尺寸契约不破,免得整图被放大
  const lh = fs + 0.5;
  const half = 0.5 * fs + ((lines.length - 1) * lh) / 2; // 文字块半高(em 盒估)
  const bottom = Math.max(inkY(icon, iconBox).bottom, iconBox.y + iconBox.h * 0.75);
  const C = r2(bottom + 1.2 + half); // 文字块视觉中线
  const H = r2(Math.max(C + half + 1.6, iconBox.y + iconBox.h + 1.5));
  const bgV = p.get('bg');
  const bg = bgV ? `<rect x="0" y="0" width="24" height="${H}" rx="${num(p, 'r', 5, 0, 12)}" fill="${color(p, 'bg', '#f1f5f9')}"/>` : '';
  const fg = color(p, 'fg', '#1e293b');
  const texts = lines
    .map((s, i) => (s.trim() ? textEl(12, C + (i - (lines.length - 1) / 2) * lh, fs, s, fg, 'middle', 600) : ''))
    .join('');
  const bcol = cornerBadges(p);
  if (bcol.length > 1) throw new DrawError('长条上的角标最多一枚 —— 图标小,双角挤');
  const badgeG = bcol.length ? badgeOnBox(iconBox, bcol[0], badgeOpts(p, 'b.')) : '';
  const body = bg + iconNode(icon, iconBox) + badgeG + texts;
  return svgDoc(24, H, body, pxOf(p, 48), `${id} ${text}`);
}

// 叠加的摆法(#12):h 左右 / v 上下 / grid 四格 / tri 上一下二(△)/ tri-inv 上二下一(▽)
const STACK_LAYOUTS: Record<string, { n: number; vb: [number, number]; boxes: Box[] }> = {
  h: { n: 2, vb: [40, 24], boxes: [{ x: 1, y: 2, w: 18, h: 20 }, { x: 21, y: 2, w: 18, h: 20 }] },
  v: { n: 2, vb: [24, 40], boxes: [{ x: 2, y: 1, w: 20, h: 18 }, { x: 2, y: 21, w: 20, h: 18 }] },
  grid: {
    n: 4, vb: [24, 24],
    boxes: [{ x: 0, y: 0 }, { x: 12.5, y: 0 }, { x: 0, y: 12.5 }, { x: 12.5, y: 12.5 }].map((p) => ({ ...p, w: 11.5, h: 11.5 })),
  },
  tri: {
    n: 3, vb: [24, 24],
    boxes: [{ x: 6.25, y: 0 }, { x: 0, y: 12.5 }, { x: 12.5, y: 12.5 }].map((p) => ({ ...p, w: 11.5, h: 11.5 })),
  },
  'tri-inv': {
    n: 3, vb: [24, 24],
    boxes: [{ x: 0, y: 0 }, { x: 12.5, y: 0 }, { x: 6.25, y: 12.5 }].map((p) => ({ ...p, w: 11.5, h: 11.5 })),
  },
};

/** stack —— 几枚图标摆成一枚(左右 / 四格 / 三角 / 倒三角);每项可带一枚角标:icons=infra:disk-array?rl=x2,aws:ec2 */
async function stack(p: URLSearchParams, getIcon: GetIcon): Promise<string> {
  const layout = p.get('layout') || 'h';
  const L = STACK_LAYOUTS[layout];
  if (!L) throw new DrawError(`layout 只认 ${Object.keys(STACK_LAYOUTS).join(' / ')},收到:${layout}`);
  const raw = (p.get('icons') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (raw.length !== L.n) {
    throw new DrawError(`layout=${layout} 要 ${L.n} 枚图标,给了 ${raw.length} 枚 —— icons=以逗号分隔,如 icons=aws:ec2,aws:s3`);
  }
  // 项内只能有一枚角标修饰(逗号分隔,项内没有 &):id?rl=x2
  const items = raw.map((s) => {
    const q = s.indexOf('?');
    if (q < 0) return { id: s, badge: null as BadgeSpec | null };
    const rest = s.slice(q + 1);
    const m = /^([A-Za-z-]+)=([^&]+)$/.exec(rest);
    const pos = m && POS_ALIAS[m[1]];
    if (!pos) throw new DrawError(`叠加项只能带一枚角标修饰(${s})—— 写法:infra:disk-array?rl=x2`);
    return { id: s.slice(0, q), badge: { pos, text: m[2].slice(0, 12) } };
  });
  const icons = await Promise.all(items.map((x) => getIcon(x.id)));
  icons.forEach((ic, i) => {
    if (!ic) throw new DrawError(`找不到图标 ${items[i].id} —— 去首页查 id:/`);
  });
  const bo = badgeOpts(p, 'b.');
  const body = icons
    .map((ic, i) => iconNode(ic!, L.boxes[i]) + (items[i].badge ? badgeOnBox(L.boxes[i], items[i].badge!, bo) : ''))
    .join('');
  return svgDoc(L.vb[0], L.vb[1], body, pxOf(p, null), items.map((x) => x.id).join(' + '));
}

// ---------------------------------------------------------------- 入口

export async function renderDraw(kind: string, p: URLSearchParams, getIcon: GetIcon): Promise<string> {
  switch (kind) {
    case 'badge': return badge(p, getIcon);
    case 'in': return inFrame(p, getIcon);
    case 'icon-text': return bar(p, getIcon, false);
    case 'text-icon': return bar(p, getIcon, true);
    case 'icon-text-v': return barV(p, getIcon);
    case 'stack': return stack(p, getIcon);
    default:
      throw new DrawError(`不认识的 kind:${kind || '(空)'}。可用:${KINDS.join(' / ')};可视化编辑在 /editor`);
  }
}

// ---------------------------------------------------------------- 合成 id

// 紧凑写法(给 /api/icons.json 与 draw 侧用,即 #12 里的提议):
//   infra:disk?rl=x2                 → badge,右下角 x2
//   infra:disk?rl=x2&lu=新           → badge,双角标(一角一枚,角点键即角标)
//   infra:disk?right-lower=120+      → 同上(长写)
//   frame:terminal?text=x-cmd        → 框内文字
//   frame:whiteboard?in=common:atom  → 框内图标
export interface ComposedSpec {
  base: string;
  kind: string;
  params: URLSearchParams;
}

export function parseComposedId(id: string): ComposedSpec | null {
  const q = id.indexOf('?');
  if (q < 0) return null;
  const base = id.slice(0, q);
  // 合成 id 整体是外层 ids= 参数的一个值,+ 在外层已解码成字面加号;
  // 再过一遍 URLSearchParams 会把 + 当空格 —— 先转义掉,120+ 才能活下来
  const params = new URLSearchParams(id.slice(q + 1).replace(/\+/g, '%2B'));
  params.set('icon', base);
  let kind = '';
  for (const k of [...params.keys()]) {
    // 角点键原样保留(badge 原生认,几个键就是几枚角标)
    if (POS_ALIAS[k]) kind = 'badge';
  }
  if (!kind && (params.has('text') || params.has('in'))) kind = 'in';
  if (!kind) return null;
  return { base, kind, params };
}
