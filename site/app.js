// x-cmd/icon 查询页。
// 一个过滤页:搜索 + 分类筛选,一边打一边筛;点图标,右侧滑出一个面板 ——
// 图标信息 + 相关图标。没有子页,分类只是筛选条件。
const BASE = new URL('.', document.baseURI).pathname;
const SVGNS = 'http://www.w3.org/2000/svg';

// ---------- 文案 ----------
// 中英文分开,页面上按语言取其一 —— 不再中英并排
const LANGS = {
  zh: {
    title: 'x-cmd/icon —— 架构图图标库',
    metaDesc: 'x-cmd 架构图图标库:云厂商官方标识 + 自绘概念图标 + 品牌标识,按 <cat>:<concept> 索引。',
    search: '搜索图标:id / 名称 / 分类',
    heroTitle: '架构图图标库',
    all: '全部',
    count: '个图标',
    shown: '已显示',
    more: '显示更多',
    lblDesc: '说明',
    lblCat: '分类',
    lblVer: '版本',
    lblVerdict: '结论',
    lblLicense: '著作权',
    lblTrademark: '商标权人',
    lblPolicy: '商标政策',
    lblRestrictions: '使用限制',
    lblReviewed: '复核',
    lblSource: '出处',
    lblFile: '文件',
    copy: '复制',
    copied: '已复制',
    copyFail: '复制失败',
    notes: '许可分析',
    src: 'SVG 源码',
    srcFail: '(取不到源码)',
    download: '下载',
    close: '关闭',
    empty: '没有匹配的图标。',
    loading: '加载中',
    vOk: '可用',
    vCaution: '谨慎 —— 限指示性引用',
    vPending: '未审 —— 商标条款未逐条核对',
    fCaution: '谨慎',
    fPending: '未审',
    alias: '别名 → ',
    aliasOf: '别名 {id} 指向这里',
    related: '相关图标',
    langBtn: 'EN',
  },
  en: {
    title: 'x-cmd/icon — icon library for architecture diagrams',
    metaDesc:
      'Icon library for x-cmd/draw: cloud vendor marks, self-drawn concepts and brand logos, keyed by <cat>:<concept>.',
    search: 'Search icons: id / name / category',
    heroTitle: 'Icon library for architecture diagrams',
    all: 'All',
    count: 'icons',
    shown: 'shown',
    more: 'Show more',
    lblDesc: 'Description',
    lblCat: 'Category',
    lblVer: 'Version',
    lblVerdict: 'Verdict',
    lblLicense: 'Copyright',
    lblTrademark: 'Trademark owner',
    lblPolicy: 'Trademark policy',
    lblRestrictions: 'Restrictions',
    lblReviewed: 'Reviewed',
    lblSource: 'Source',
    lblFile: 'File',
    copy: 'Copy',
    copied: 'Copied',
    copyFail: 'Copy failed',
    notes: 'License analysis',
    src: 'SVG source',
    srcFail: '(source unavailable)',
    download: 'Download',
    close: 'Close',
    empty: 'No matching icons.',
    loading: 'loading',
    vOk: 'OK',
    vCaution: 'Caution — indicative use only',
    vPending: 'Unreviewed — trademark terms not checked one by one',
    fCaution: 'Caution',
    fPending: 'Unreviewed',
    alias: 'Alias → ',
    aliasOf: 'Alias {id} points here',
    related: 'Related icons',
    langBtn: '中',
  },
};

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

let DATA = { cats: [], icons: [] };
let q = ''; // 搜索词
let cat = ''; // 分类筛选;空 = 全部
let lang = 'zh';
const LIMIT0 = 60; // 默认只显示前 60 个 —— 要更多点「显示更多」,那才会去下载
let limit = LIMIT0;
let V = ''; // 构建号:URL 上带上,重新部署后不会顶着旧缓存
let current = null; // 面板里正在看的图标

// 图标是分包装的:首页先拿 star(精选)那一小包,其余分类在后台一个一个拉,
// 到了就合并进来 —— 客户端融合,不用一次把五 MB 的 sprite 全拉下来。
let BUNDLES = {}; // 包名 → { icons, sprite, manifest }
const ICONS = new Map(); // id → 图标信息(已加载的)
const LOADED = new Set(); // 已经拉过的包
let PENDING = 0; // 还在路上的包
let TOTAL = 0; // 首页默认能看到多少个(index.json 的 browsable)
let ALL = 0; // 全库条目数(含各版本的旧版)

const byId = new Map();
const ZH = new Map(); // id → 中文名(翻译包,切到中文时才下)
const t = (key) => (LANGS[lang] && LANGS[lang][key]) || key;

// 清单里是英文(原版);中文在单独的翻译包里 —— 英文区不用下它
async function loadZh() {
  if (ZH.size || ZHloading) return;
  ZHloading = true;
  try {
    const res = await fetch(`${BASE}manifest.zh.json${V}`);
    if (!res.ok) return;
    const j = await res.json();
    for (const k in j) ZH.set(k, j[k]);
  } catch {}
  ZHloading = false;
}
let ZHloading = false;

// 从 id 推出来的字段 —— 清单里不带,省体积
const spriteIdOf = (id) => id.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
const pathOf = (id) => `i/${id.replace(':', '/')}.svg`;
const catOf = (cat) => DATA.cats.find((c) => c.cat === cat) || {};

// ---------- 片:一页的图形按片下,片的本体缓存在本地 ----------
// 一片 = 一个 sprite 文件(≤300 个符号)。页面只下看得见的那几片,
// 下过的片存在 localStorage 里,下次直接用 —— 十万个图标也是同一套。
const SHARD_MAX = 4 * 1024 * 1024; // 本地缓存上限(localStorage 大约 5 MB)
const shardURLs = new Map(); // 片 → blob URL
let shardIndex = {}; // 片 → { t: 时间, s: 字节 }

function cacheLoad() {
  try {
    shardIndex = JSON.parse(localStorage.getItem('icon-shards') || '{}');
  } catch {
    shardIndex = {};
  }
}
function cacheGet(file) {
  try {
    return localStorage.getItem('icon-shard:' + file);
  } catch {
    return null;
  }
}
function cachePut(file, text) {
  try {
    localStorage.setItem('icon-shard:' + file, text);
    shardIndex[file] = { t: Date.now(), s: text.length };
    let total = Object.values(shardIndex).reduce((a, b) => a + b.s, 0);
    if (total > SHARD_MAX) {
      // 淘汰最老的片
      for (const k of Object.keys(shardIndex).sort((a, b) => shardIndex[a].t - shardIndex[b].t)) {
        if (total <= SHARD_MAX) break;
        localStorage.removeItem('icon-shard:' + k);
        total -= shardIndex[k].s;
        delete shardIndex[k];
      }
    }
    localStorage.setItem('icon-shards', JSON.stringify(shardIndex));
  } catch {
    // 配额满了就算了 —— 只是缓存,没有它照样能用
  }
}
// 片取回来之后,把里面的 <symbol> 注入页面上的一个隐藏 svg ——
// 图标用 <use href="#符号id"> 引用本地符号:
// 不再每个图标都去解析一次 blob(那会在网络面板里刷出几十条记录),也只解析一次。
let spriteHost = null;
function host() {
  if (!spriteHost) {
    spriteHost = document.createElementNS(SVGNS, 'svg');
    spriteHost.setAttribute('style', 'display:none');
    spriteHost.setAttribute('aria-hidden', 'true');
    document.body.append(spriteHost);
  }
  return spriteHost;
}
async function shardURL(file) {
  if (shardURLs.has(file)) return shardURLs.get(file);
  let text = cacheGet(file);
  if (!text) {
    const res = await fetch(`${BASE}${file}${V}`);
    if (!res.ok) return null;
    text = await res.text();
    cachePut(file, text);
  }
  try {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const symbols = doc.documentElement.querySelectorAll('symbol');
    const h = host();
    for (const sym of symbols) h.append(document.importNode(sym, true));
  } catch {}
  shardURLs.set(file, true);
  return true;
}
// 清单也缓存一份(小的那些)
async function loadManifest(name) {
  const res = await fetch(`${BASE}${name}${V}`);
  if (!res.ok) return;
  const j = await res.json();
  for (const m of j.icons) {
    if (!ICONS.has(m.id)) ICONS.set(m.id, m);
  }
  DATA.icons = [...ICONS.values()];
}

function applyI18n() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  for (const n of document.querySelectorAll('[data-i18n]')) n.textContent = t(n.dataset.i18n);
  for (const n of document.querySelectorAll('[data-i18n-html]')) n.innerHTML = t(n.dataset.i18nHtml);
  for (const n of document.querySelectorAll('[data-i18n-ph]')) n.placeholder = t(n.dataset.i18nPh);
  $('#lang').textContent = t('langBtn');
  document.title = t('title');
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', t('metaDesc'));
}

// ---------- 图标 ----------
// 矢量图标走 sprite:符号在哪个包里就从哪个包里引用
// PNG(云厂商那批)进不了 sprite,还是单独文件
function iconEl(m) {
  const sid = spriteIdOf(m.id);
  if (sid) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', m.viewBox || '0 0 24 24');
    svg.setAttribute('class', 'ic' + (catOf(m.cat).mono ? ' mono' : ''));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', m.id);
    const use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', `#${sid}`);
    svg.append(use);
    return svg;
  }
  const img = el('img');
  img.src = `${BASE}${pathOf(m.id)}${V}`;
  img.alt = m.id;
  img.loading = 'lazy';
  return img;
}

function descOf(m) {
  return lang === 'en' ? m.descEn : ZH.get(m.id) || m.descEn;
}

// ---------- SVG 源码:展开 + 高亮 ----------
// 图标文件在仓里是单行的(sprite 一行一个 symbol),显示时展开成缩进的可读格式。
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function prettySvg(src) {
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || doc.getElementsByTagNameNS('*', 'parsererror').length) return null;
  const out = [];
  const esc = (v) => escHtml(v).replace(/"/g, '&quot;');
  // 输出的还是转义过的文本 —— 高亮器按 &lt; 认标签,直接吐真 < 会被浏览器当元素吃掉
  const walk = (el, depth) => {
    const pad = '  '.repeat(depth);
    const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${esc(a.value)}"`).join('');
    const kids = Array.from(el.childNodes).filter(
      (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())
    );
    if (!kids.length) {
      out.push(`${pad}&lt;${el.tagName}${attrs}/&gt;`);
      return;
    }
    out.push(`${pad}&lt;${el.tagName}${attrs}&gt;`);
    for (const k of kids) {
      if (k.nodeType === 1) walk(k, depth + 1);
      else out.push('  '.repeat(depth + 1) + esc(k.textContent.trim()));
    }
    out.push(`${pad}&lt;/${el.tagName}&gt;`);
  };
  walk(root, 0);
  return out.join('\n');
}

// 自己写的小高亮器:标签、属性名、属性值、注释各一个颜色。
// 不引第三方库 —— 页面就一个文件,几十行够了。输入是已经转义过的文本。
function highlightSvg(escaped) {
  return escaped.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([a-zA-Z][\w:.-]*)|([a-zA-Z][\w:.-]*)(\s*=\s*)("[^"]*")|(\/?&gt;)/g,
    (all, com, pre, name, attr, eq, val, punc) => {
      if (com) return `<span class="tok-com">${com}</span>`;
      if (pre) return `<span class="tok-pun">${pre}</span><span class="tok-tag">${name}</span>`;
      if (attr) return `<span class="tok-attr">${attr}</span>${eq}<span class="tok-str">${val}</span>`;
      if (punc) return `<span class="tok-pun">${punc}</span>`;
      return all;
    }
  );
}

// 分类名与说明:中英文分开,英文版不能还挂着中文
const catTitle = (c) => (c ? (lang === 'en' ? c.titleEn || c.title : c.title) : '');
const catNote = (c) => (c ? (lang === 'en' ? c.noteEn || c.note : c.note) : '');

function match(m) {
  if (cat && m.cat !== cat) return false;
  // 空查询:只显示推荐版本(别名),别把每一版都摆出来;打了字才把各版本都放出来
  if (!q) return !m.version || m.recommended;
  // 中英文都进搜索:中文名在翻译包里,英文名在清单里
  const hay = `${m.id} ${m.aliasFor || ''} ${m.descEn} ${ZH.get(m.id) || ''} ${m.cat} ${m.concept}`.toLowerCase();
  return hay.includes(q);
}

function cell(m) {
  const c = el('div', 'cell');
  c.dataset.id = m.id;
  c.title = descOf(m);
  c.append(iconEl(m), el('div', 'id', m.aliasFor || m.id));
  if (m.version && !m.recommended) c.append(el('span', 'vbadge', m.version));
  if (m.verdict === 'caution') c.append(el('span', 'vflag caution', t('fCaution')));
  if (m.verdict === 'pending') c.append(el('span', 'vflag pending', t('fPending')));
  c.append(el('div', 'desc', descOf(m)));
  c.addEventListener('click', () => openPanel(m));
  return c;
}

// 渲染前 limit 个,其余给「显示更多」
// 没下载的那部分也算进"还剩多少" —— 点了「显示更多」才去把剩下的包拉下来
function grid(host, list) {
  const shown = list.slice(0, limit);
  host.textContent = '';
  for (const m of shown) host.append(cell(m));
  const left = list.length - shown.length;
  const rest = left + (ALL - ICONS.size);
  for (const more of document.querySelectorAll('.more')) {
    more.hidden = rest <= 0;
    more.textContent = `${t('more')} (${rest})`;
    more.onclick = () => {
      limit += 240;
      render();
      loadRest(true); // 边下边显示:包到了就合并,列表跟着长
    };
  }
  return shown.length;
}

// ---------- 过滤页 ----------
function renderFilters() {
  const host = $('#filters');
  host.textContent = '';
  const mk = (label, value) => {
    const b = el('button', 'chip' + (cat === value ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => setCat(value));
    host.append(b);
  };
  mk(t('all'), '');
  for (const c of DATA.cats) mk(catTitle(c), c.cat);
}

async function render() {
  renderFilters();
  const list = DATA.icons.filter(match);
  // 先把要用的片取回来(本地有就直接用,没有就下)—— 十万个图标也只下看得见的几片
  const need = new Set();
  for (const m of list.slice(0, limit)) if (m.shard) need.add(m.shard);
  await Promise.all([...need].map(shardURL));
  const shown = grid($('#all'), list);
  // 没打搜索词就报总数 —— 搜索框里那个数字是"库里有多少",不是"眼下摆了多少"
  const n = q ? list.length : TOTAL;
  $('#all-count').textContent =
    `${n.toLocaleString()} ${t('count')}` + (PENDING ? ` · ${t('loading')}` : '');
  $('#empty').hidden = shown > 0;
  $('#empty').textContent = t('empty');
  locate();
}

// ---------- 分包加载 ----------
// 一个包 = 一份清单 + 一张 sprite。清单和 sprite 都要到齐,图标才画得出来。
async function loadBundle(name) {
  if (LOADED.has(name)) return;
  const b = BUNDLES[name];
  if (!b) return;
  LOADED.add(name);
  PENDING++;
  try {
    await loadManifest(b.manifest);
    for (const m of DATA.icons) byId.set(m.id, m);
  } catch (err) {
    LOADED.delete(name);
  } finally {
    PENDING--;
  }
  render();
}

// 搜索要跨全库 —— 一次把全名单下下来过滤
async function loadAll() {
  if (LOADED.has('*')) return;
  LOADED.add('*');
  PENDING++;
  try {
    await loadManifest('manifest.json');
    for (const m of DATA.icons) byId.set(m.id, m);
  } catch (err) {
    LOADED.delete('*');
  } finally {
    PENDING--;
  }
  render();
}

// 后台把其余分类一个一个拉下来 —— 到了就合并进列表
let loading = false;
async function loadRest(includeBulk) {
  if (loading) return;
  loading = true;
  try {
    for (const name of Object.keys(BUNDLES)) {
      if (name === 'star' || LOADED.has(name)) continue;
      if (!includeBulk && (name === 'bootstrap' || name === 'iconpark')) continue;
      await loadBundle(name);
    }
  } finally {
    loading = false;
  }
}

function setCat(value) {
  cat = value;
  limit = LIMIT0;
  pushUrl();
  // 点哪个分类就下哪个包
  if (value) loadBundle(value);
  render();
}

function setQuery(v) {
  q = v.trim().toLowerCase();
  for (const e of qEls) e.value = v;
  $('#clear2').hidden = !q;
  limit = LIMIT0;
  pushUrl();
  // 搜索要跨全库 —— 全名单下下来过滤
  if (q) loadAll();
  render();
}

// 筛选条件进 URL —— 链接能分享,后退也能用
function pushUrl() {
  const url = new URL(location.href);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  if (cat) url.searchParams.set('cat', cat);
  else url.searchParams.delete('cat');
  history.replaceState({}, '', url.pathname + url.search + url.hash);
}

// ---------- 右侧面板 ----------
const panel = $('#panel');
const scrim = $('#scrim');

function row(sel, value) {
  const n = $(sel);
  const dd = n.closest('dd');
  const dt = dd.previousElementSibling; // 这一行的标题 —— 得跟 dd 一起藏,不然配对会错位
  if (value) {
    dd.hidden = false;
    dt.hidden = false;
    n.textContent = value;
  } else {
    dd.hidden = true;
    dt.hidden = true;
  }
}

async function openPanel(m) {
  current = m;
  $('#p-id').textContent = m.aliasFor || m.id;
  $('#p-desc').textContent = descOf(m);
  $('#p-preview').replaceChildren(iconEl(m));
  $('#p-cat').textContent = catTitle(DATA.cats.find((c) => c.cat === m.cat)) || m.cat;
  $('#p-source').textContent = catOf(m.cat).source || '';
  // 版本:别名条目指向推荐版本的具体键,具体版本标出指向它的别名
  if (m.version) {
    // 推荐版:概念键就是它;别的版本:说明概念键指向哪一版
    row('#p-version', m.recommended
      ? `${m.version}(推荐)`
      : `${m.version} — ${t('aliasOf').replace('{id}', m.aliasFor || m.id)}`);
  } else row('#p-version', '');
  row('#p-license', catOf(m.cat).license || '');
  row('#p-trademark', m.trademark);
  row('#p-restrictions', (m.restrictions || '').replace(/;/g, '; '));
  row('#p-reviewed', m.reviewed);

  const v = $('#p-verdict');
  const vdd = v.closest('dd');
  const vdt = vdd.previousElementSibling;
  if (m.verdict) {
    vdd.hidden = false;
    vdt.hidden = false;
    v.textContent = { ok: t('vOk'), caution: t('vCaution'), pending: t('vPending') }[m.verdict] || m.verdict;
    v.className = 'verdict ' + m.verdict;
  } else {
    vdd.hidden = true;
    vdt.hidden = true;
    v.className = '';
  }

  const pol = $('#p-policy');
  const pdd = pol.closest('dd');
  const pdt = pdd.previousElementSibling;
  if (m.trademarkPolicy && /^https?:/.test(m.trademarkPolicy)) {
    pdd.hidden = false;
    pdt.hidden = false;
    pol.textContent = '';
    const a = document.createElement('a');
    a.href = m.trademarkPolicy;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = m.trademarkPolicy.replace(/^https?:\/\//, '').slice(0, 60);
    pol.append(a);
  } else {
    pdd.hidden = true;
    pdt.hidden = true;
  }

  const nw = $('#p-notes-wrap');
  if (m.notes) {
    nw.hidden = false;
    $('#p-notes').textContent = m.notes;
  } else {
    nw.hidden = true;
  }

  const a = $('#p-file');
  a.href = `${BASE}${pathOf(m.id)}${V}`;
  a.download = m.id.split(':')[1].replace(/^.*\//, '') + '.svg';

  const wrap = $('#p-src-wrap');
  wrap.hidden = false;
  $('#p-src').textContent = '…';
  try {
    const txt = await (await fetch(`${BASE}${pathOf(m.id)}${V}`)).text();
    // 文件是单行的,展开成缩进的可读格式再上色
    $('#p-src').innerHTML = highlightSvg(prettySvg(txt) ?? escHtml(txt));
  } catch {
    $('#p-src').textContent = t('srcFail');
  }

  renderRelated(m);

  panel.hidden = false;
  scrim.hidden = false;
  requestAnimationFrame(() => {
    panel.classList.add('on');
    scrim.classList.add('on');
  });
  panel.querySelector('.panel-body').scrollTop = 0;
  history.replaceState({}, '', location.pathname + location.search + `#${encodeURIComponent(m.id)}`);
}

function closePanel() {
  panel.classList.remove('on');
  scrim.classList.remove('on');
  current = null;
  setTimeout(() => {
    panel.hidden = true;
    scrim.hidden = true;
  }, 220);
  history.replaceState({}, '', location.pathname + location.search);
}

// ---------- 相关图标 ----------
// 同分类的邻居 + 同名概念 + 描述里共同的词
function tokens(m) {
  const set = new Set();
  const text = `${m.concept} ${m.descEn} ${ZH.get(m.id) || ''}`.toLowerCase();
  for (const w of text.split(/[^a-z0-9一-龥]+/)) {
    if (w.length > 1) set.add(w);
  }
  // 中文按两字一组,粗粒度地算相关
  for (const run of text.match(/[一-龥]{2,}/g) || []) {
    for (let i = 0; i + 2 <= run.length; i++) set.add(run.slice(i, i + 2));
  }
  return set;
}

function related(m, n = 12) {
  const mine = tokens(m);
  const out = [];
  for (const o of DATA.icons) {
    if (o.id === m.id) continue;
    let s = 0;
    // 同一个概念的另一个版本(emoji 的 Twemoji / Fluent 两版)—— 排在最前
    if (o.concept === m.concept) s += 5;
    if (o.cat === m.cat) s += 3;
    for (const w of tokens(o)) if (mine.has(w)) s += 2;
    if (s) out.push([s, o]);
  }
  out.sort((a, b) => b[0] - a[0] || (a[1].id < b[1].id ? -1 : 1));
  return out.slice(0, n).map((x) => x[1]);
}

function renderRelated(m) {
  const host = $('#p-related');
  host.textContent = '';
  for (const o of related(m)) {
    const c = el('div', 'cell small');
    c.dataset.id = o.id;
    c.title = descOf(o);
    c.append(iconEl(o), el('div', 'id', o.id));
    c.addEventListener('click', () => openPanel(o));
    host.append(c);
  }
}

// ---------- 定位 ----------
function locate() {
  for (const c of document.querySelectorAll('.cell.hit')) c.classList.remove('hit');
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const c = document.querySelector(`.cell[data-id="${CSS.escape(id)}"]`);
  if (!c) return;
  c.classList.add('hit');
  c.classList.remove('flash');
  void c.offsetWidth;
  c.classList.add('flash');
  c.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ---------- 搜索 / 语言 ---------- */
const qEls = [$('#q2')];
for (const e of qEls) e.addEventListener('input', () => setQuery(e.value));
$('#clear2').addEventListener('click', () => {
  setQuery('');
  qEls[0].focus();
});
$('#lang').addEventListener('click', async () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  try {
    localStorage.setItem('icon-lang', lang);
  } catch {}
  applyI18n();
  if (lang === 'zh') await loadZh(); // 中文名在翻译包里,切过去才下
  render();
  if (current) openPanel(current);
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== qEls[0] && !panel.hidden) {
    e.preventDefault();
    qEls[0].focus();
    qEls[0].select();
  }
  if (e.key === '/' && document.activeElement !== qEls[0]) {
    e.preventDefault();
    qEls[0].focus();
    qEls[0].select();
  }
  if (e.key === 'Escape' && !panel.hidden) closePanel();
});

/* ---------- 主题 ---------- */
// 默认暗色
const themeBtn = $('#theme');
function applyTheme(v) {
  document.documentElement.setAttribute('data-theme', v === 'dark' ? 'dark' : 'light');
  try {
    localStorage.setItem('icon-theme', document.documentElement.getAttribute('data-theme'));
  } catch {}
}
themeBtn.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});
try {
  applyTheme(localStorage.getItem('icon-theme') || 'dark');
} catch {
  applyTheme('dark');
}

/* ---------- 启动 ---------- */
function syncFromUrl() {
  const p = new URL(location.href).searchParams;
  q = (p.get('q') || '').trim().toLowerCase();
  cat = p.get('cat') || '';
  for (const e of qEls) e.value = p.get('q') || '';
  $('#clear2').hidden = !q;
  limit = LIMIT0;
  // 深链直接带着分类/搜索词来的 —— 对应的包得下
  if (cat) loadBundle(cat);
  if (q) loadAll(); // 搜索要跨全库
  render();
}
window.addEventListener('popstate', syncFromUrl);
window.addEventListener('hashchange', () => {
  const id = decodeURIComponent(location.hash.slice(1));
  const m = byId.get(id);
  if (m && m !== current) openPanel(m);
  else locate();
});

$('#p-close').addEventListener('click', closePanel);
scrim.addEventListener('click', closePanel);
$('#p-id').addEventListener('click', async (e) => {
  try {
    await navigator.clipboard.writeText($('#p-id').textContent);
  } catch {}
});

(async () => {
  try {
    try {
      lang = localStorage.getItem('icon-lang') || lang;
    } catch {}
    // 构建号是 Worker 注入的 —— 不用等索引回来就能带上版本号
    V = window.__ICON_BUILD__ ? `?v=${window.__ICON_BUILD__}` : '';
    if (lang === 'zh') loadZh(); // 中文名在翻译包里
    applyI18n();
    cacheLoad();
    // 索引和精选那一小包并行拉 —— 首页马上有东西看
    const idxP = fetch(`${BASE}index.json${V}`).then((r) => r.json());
    const starP = Promise.all([shardURL('sprite.star.svg'), loadManifest('manifest.star.json')]);
    const idx = await idxP;
    BUNDLES = idx.bundles || {};
    TOTAL = idx.browsable || idx.total || 0;
    ALL = idx.total || 0;
    DATA.cats = idx.cats || [];
    renderFilters();
    for (const m of DATA.icons) byId.set(m.id, m);
    await starP;
    render();
    syncFromUrl();
    // 深链带 #<id> 的,直接开面板
    const id = decodeURIComponent(location.hash.slice(1));
    const m = id && byId.get(id);
    if (m) openPanel(m);
    // 其余分类不自动下 —— 等用户点「显示更多」或者搜索
  } catch (err) {
    document.querySelector('main').innerHTML = `<p class="empty">${t('empty')}</p>`;
  }
})();
