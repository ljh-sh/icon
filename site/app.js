// x-cmd/icon 查询页。
// 路由:/            首页 —— 一个过滤页(搜索 + 分类筛选),一边打一边筛
//      /c/<cat>    某个分类的完整列表(带版本切换)
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
    heroSub: '给 x-cmd/draw 画架构图用的图标 · 键名 <cat>:<concept> · 一边打一边筛',
    all: '全部',
    count: '个图标',
    shown: '已显示',
    more: '显示更多',
    navAll: '← 全部图标',
    rec: '推荐',
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
    emptyCat: '这个分类还没有图标。',
    vOk: '可用',
    vCaution: '谨慎 —— 限指示性引用',
    vPending: '未审 —— 商标条款未逐条核对',
    fCaution: '谨慎',
    fPending: '未审',
    alias: '别名 → ',
    aliasOf: '别名 {id} 指向这里',
    footer:
      '图标版权归各自权利人所有;云厂商标识来自 <a href="https://github.com/mingrammer/diagrams" target="_blank" rel="noopener">mingrammer/diagrams</a>(Apache-2.0),通用概念与公司符号为本仓自绘(不含任何商标图形)。',
    langBtn: 'EN',
  },
  en: {
    title: 'x-cmd/icon — icon library for architecture diagrams',
    metaDesc:
      'Icon library for x-cmd/draw: cloud vendor marks, self-drawn concepts and brand logos, keyed by <cat>:<concept>.',
    search: 'Search icons: id / name / category',
    heroTitle: 'Icon library for architecture diagrams',
    heroSub: 'Icons for x-cmd/draw · key format <cat>:<concept> · filters as you type',
    all: 'All',
    count: 'icons',
    shown: 'shown',
    more: 'Show more',
    navAll: '← All icons',
    rec: 'Recommended',
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
    emptyCat: 'This category has no icons yet.',
    vOk: 'OK',
    vCaution: 'Caution — indicative use only',
    vPending: 'Unreviewed — trademark terms not checked one by one',
    fCaution: 'Caution',
    fPending: 'Unreviewed',
    alias: 'Alias → ',
    aliasOf: 'Alias {id} points here',
    footer:
      'Icon copyrights belong to their respective owners; cloud vendor marks come from <a href="https://github.com/mingrammer/diagrams" target="_blank" rel="noopener">mingrammer/diagrams</a> (Apache-2.0); general concepts and company symbols are self-drawn (no trademark artwork).',
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
let q = '';
let ver = ''; // 版本化分类里当前看的版本;空 = 推荐版本
let catFilter = ''; // 首页的分类筛选;空 = 全部
let lang = 'zh';
let limit = 240; // 一次渲染多少个(两三千个节点一起铺会卡)
let hitId = null;
let V = ''; // 构建号:URL 上带上,重新部署后不会顶着旧缓存

const byId = new Map();
const t = (key) => (LANGS[lang] && LANGS[lang][key]) || key;

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
// 矢量图标走 sprite:一次请求拿全,页面用 <use> 引用
// PNG(云厂商那批)进不了 sprite,还是单独文件
function iconEl(m) {
  if (m.spriteId) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', m.viewBox || '0 0 24 24');
    svg.setAttribute('class', 'ic' + (m.mono ? ' mono' : ''));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', m.id);
    const use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', `${BASE}sprite.svg${V}#${m.spriteId}`);
    svg.append(use);
    return svg;
  }
  const img = el('img');
  img.src = `${BASE}${m.path}${V}`;
  img.alt = m.id;
  img.loading = 'lazy';
  return img;
}

function descOf(m) {
  return lang === 'en' ? m.descEn || m.desc : m.desc || m.descEn;
}

function match(m) {
  if (catFilter && m.cat !== catFilter) return false;
  // 空查询:只显示推荐版本(别名),别把每一版都摆出来;打了字才把各版本都放出来
  if (!q) return !m.version || m.alias;
  const hay = `${m.id} ${m.desc} ${m.descEn} ${m.cat} ${m.concept}`.toLowerCase();
  return hay.includes(q);
}

function cell(m) {
  const c = el('div', 'cell');
  c.dataset.id = m.id;
  c.title = descOf(m);
  c.append(iconEl(m), el('div', 'id', m.id));
  if (m.version && !m.alias) c.append(el('span', 'vbadge', m.version));
  if (m.verdict === 'caution') c.append(el('span', 'vflag caution', t('fCaution')));
  if (m.verdict === 'pending') c.append(el('span', 'vflag pending', t('fPending')));
  c.append(el('div', 'desc', descOf(m)));
  c.addEventListener('click', () => onCell(m));
  return c;
}

// 渲染前 limit 个,其余给「显示更多」
function grid(host, list) {
  const shown = list.slice(0, limit);
  host.textContent = '';
  for (const m of shown) host.append(cell(m));
  const left = list.length - shown.length;
  for (const more of document.querySelectorAll('.more')) {
    more.hidden = left <= 0;
    more.textContent = `${t('more')} (${left})`;
    more.onclick = () => {
      limit += 240;
      render();
    };
  }
  return shown.length;
}

// ---------- 首页 ----------
function renderFilters() {
  const host = $('#filters');
  host.textContent = '';
  const mk = (label, value, n) => {
    const b = el('button', 'chip' + (catFilter === value ? ' on' : ''), label);
    b.type = 'button';
    if (n != null) b.append(el('span', 'n', n));
    b.addEventListener('click', () => {
      catFilter = value;
      limit = 240;
      render();
    });
    host.append(b);
  };
  mk(t('all'), '', DATA.icons.length);
  for (const c of DATA.cats) mk(c.title, c.cat, c.count);
}

function renderHome() {
  $('#filters').hidden = false;
  renderFilters();
  const list = DATA.icons.filter(match);
  const n = grid($('#all'), list);
  $('#all-count').textContent = `${list.length.toLocaleString()} ${t('count')}`;
  $('#empty').hidden = n > 0;
  $('#empty').textContent = t('empty');
}

// ---------- 分类页 ----------
function renderVersions(vers) {
  const host = $('#cat-vers');
  host.textContent = '';
  host.hidden = !vers.length;
  if (!vers.length) return;
  const mk = (label, value) => {
    const b = el('button', 'vbtn' + (ver === value ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => setVersion(value));
    host.append(b);
  };
  mk(t('rec'), '');
  for (const v of vers) mk(v, v);
}

function renderCat(cat) {
  const meta = DATA.cats.find((c) => c.cat === cat);
  $('#cat-title').textContent = meta ? meta.title : cat;
  $('#cat-note').textContent = meta
    ? `${meta.count} ${t('count')} · ${meta.source} · ${meta.license} · ${meta.note}`
    : '';
  const vers = meta?.versions || [];
  renderVersions(vers);
  // 「推荐」看别名条目(概念键),具体版本看该版本的条目
  const list = vers.length
    ? DATA.icons.filter((m) => m.cat === cat && (ver ? m.version === ver && !m.alias : m.alias))
    : DATA.icons.filter((m) => m.cat === cat);
  const n = grid($('#cat-grid'), list);
  $('#all-count').textContent = `${list.length.toLocaleString()} ${t('count')}`;
  $('#empty').hidden = n > 0;
  $('#empty').textContent = list.length ? t('empty') : t('emptyCat');
}

function setVersion(v) {
  ver = v;
  limit = 240;
  const url = new URL(location.href);
  if (v) url.searchParams.set('v', v);
  else url.searchParams.delete('v');
  history.pushState({}, '', url.pathname + url.search + url.hash);
  render();
}

// ---------- 路由 ----------
function catRoute() {
  const rel = location.pathname.startsWith(BASE)
    ? location.pathname.slice(BASE.length)
    : location.pathname.replace(/^\//, '');
  const m = rel.match(/^c\/([a-z0-9-]+)/i);
  return m ? m[1] : null;
}

function render() {
  const cat = catRoute();
  const home = $('#home');
  const catp = $('#cat');
  if (cat) {
    home.hidden = true;
    catp.hidden = false;
    document.body.classList.remove('is-home');
    renderCat(cat);
  } else {
    catp.hidden = true;
    home.hidden = false;
    document.body.classList.add('is-home');
    renderHome();
  }
  locate();
}

function locate() {
  for (const c of document.querySelectorAll('.cell.hit')) c.classList.remove('hit');
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const c = document.querySelector(`.cell[data-id="${CSS.escape(id)}"]`);
  if (!c) return;
  hitId = id;
  c.classList.add('hit');
  c.classList.remove('flash');
  void c.offsetWidth;
  c.classList.add('flash');
  c.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function navigate(url) {
  const u = new URL(url, location.origin);
  if (q) u.searchParams.set('q', q);
  history.pushState({}, '', u);
  ver = u.searchParams.get('v') || '';
  render();
  window.scrollTo({ top: 0 });
}

function onCell(m) {
  const u = new URL(`${BASE}c/${m.cat}`, location.origin);
  u.hash = encodeURIComponent(m.id);
  if (q) u.searchParams.set('q', q);
  if (ver) u.searchParams.set('v', ver);
  const url = u.pathname + u.search + u.hash;
  if (catRoute() === m.cat) {
    history.pushState({}, '', url);
    locate();
    openDetail(m);
  } else {
    navigate(url);
  }
}

/* ---------- 详情 ---------- */
const dlg = $('#detail');

function row(sel, value) {
  const n = $(sel);
  const dd = n.closest('dd');
  if (value) {
    dd.hidden = false;
    n.textContent = value;
  } else {
    dd.hidden = true;
  }
}

async function openDetail(m) {
  $('#dlg-img').replaceWith(withImg(m));
  $('#dlg-img').id = 'dlg-img';
  $('#dlg-id').textContent = m.id;
  $('#dlg-desc').textContent = descOf(m);
  $('#dlg-cat').textContent = (DATA.cats.find((c) => c.cat === m.cat) || {}).title || m.cat;
  $('#dlg-source').textContent = m.source;
  // 版本:别名条目指向推荐版本的具体键,具体版本标出指向它的别名
  if (m.alias) row('#dlg-version', t('alias') + m.aliasOf);
  else if (m.version) row('#dlg-version', m.aliasFor ? `${m.version} — ${t('aliasOf').replace('{id}', m.aliasFor)}` : m.version);
  else row('#dlg-version', '');
  row('#dlg-license', m.license);
  row('#dlg-trademark', m.trademark);
  row('#dlg-restrictions', (m.restrictions || '').replace(/;/g, '; '));
  row('#dlg-reviewed', m.reviewed);

  const v = $('#dlg-verdict');
  const vdd = v.closest('dd');
  if (m.verdict) {
    vdd.hidden = false;
    v.textContent = { ok: t('vOk'), caution: t('vCaution'), pending: t('vPending') }[m.verdict] || m.verdict;
    v.className = 'verdict ' + m.verdict;
  } else {
    vdd.hidden = true;
    v.className = '';
  }

  const pol = $('#dlg-policy');
  const pdd = pol.closest('dd');
  if (m.trademarkPolicy && /^https?:/.test(m.trademarkPolicy)) {
    pdd.hidden = false;
    pol.textContent = '';
    const a = document.createElement('a');
    a.href = m.trademarkPolicy;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = m.trademarkPolicy.replace(/^https?:\/\//, '').slice(0, 60);
    pol.append(a);
  } else {
    pdd.hidden = true;
  }

  const nw = $('#dlg-notes-wrap');
  if (m.notes) {
    nw.hidden = false;
    $('#dlg-notes').textContent = m.notes;
  } else {
    nw.hidden = true;
  }

  const a = $('#dlg-file');
  a.href = `${BASE}${m.path}${V}`;
  a.download = m.file.replace(/^.*\//, '');
  const wrap = $('#dlg-src-wrap');
  if (m.mime === 'image/svg+xml') {
    wrap.hidden = false;
    $('#dlg-src').textContent = '…';
    try {
      const txt = await (await fetch(`${BASE}${m.path}${V}`)).text();
      $('#dlg-src').textContent = txt;
    } catch {
      $('#dlg-src').textContent = t('srcFail');
    }
  } else {
    wrap.hidden = true;
  }
  if (!dlg.open) dlg.showModal();
}

// 详情里的预览:统一成 <svg> 或 <img>,换语言时不用重建
function withImg(m) {
  const img = iconEl(m);
  img.id = 'dlg-img';
  img.removeAttribute('loading');
  if (img.tagName === 'img') img.classList.add('preview-img');
  return img;
}

dlg.addEventListener('click', (e) => {
  if (e.target === dlg) dlg.close();
});
dlg.querySelector('.dlg-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const id = $('#dlg-id').textContent;
  try {
    await navigator.clipboard.writeText(id);
    btn.textContent = t('copied');
    setTimeout(() => (btn.textContent = t('copy')), 1200);
  } catch {
    btn.textContent = t('copyFail');
  }
});

/* ---------- 搜索 / 语言 ---------- */
const qEls = [$('#q'), $('#q2')];
function setQuery(v, push) {
  q = v.trim().toLowerCase();
  for (const e of qEls) e.value = v;
  for (const id of ['#clear', '#clear2']) $(id).hidden = !q;
  limit = 240;
  const url = new URL(location.href);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  history[push ? 'pushState' : 'replaceState']({}, '', url.pathname + url.search + url.hash);
  render();
}
for (const e of qEls) e.addEventListener('input', () => setQuery(e.value, false));
for (const id of ['#clear', '#clear2']) {
  $(id).addEventListener('click', () => {
    setQuery('', false);
    qEls[0].focus();
  });
}
$('#lang').addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  try {
    localStorage.setItem('icon-lang', lang);
  } catch {}
  applyI18n();
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== qEls[0] && document.activeElement !== qEls[1] && !dlg.open) {
    e.preventDefault();
    (catRoute() ? qEls[0] : qEls[1]).focus();
    (catRoute() ? qEls[0] : qEls[1]).select();
  }
  if (e.key === 'Escape' && document.activeElement === qEls[0]) qEls[0].blur();
  if (e.key === 'Escape' && document.activeElement === qEls[1]) qEls[1].blur();
});

/* ---------- 主题 ---------- */
const themeBtn = $('#theme');
function applyTheme(v) {
  if (v) document.documentElement.setAttribute('data-theme', v);
  else document.documentElement.removeAttribute('data-theme');
  try {
    localStorage.setItem('icon-theme', v || '');
  } catch {}
}
themeBtn.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : cur === 'light' ? '' : 'dark';
  applyTheme(next);
});
try {
  const saved = localStorage.getItem('icon-theme');
  if (saved) applyTheme(saved);
} catch {}

/* ---------- 启动 ---------- */
function syncFromUrl() {
  const p = new URL(location.href).searchParams;
  const v = p.get('q') || '';
  q = v.trim().toLowerCase();
  for (const e of qEls) e.value = v;
  for (const id of ['#clear', '#clear2']) $(id).hidden = !q;
  ver = p.get('v') || '';
  limit = 240;
  render();
}
window.addEventListener('popstate', syncFromUrl);
window.addEventListener('hashchange', locate);

// 页内链接(面包屑)走前端路由,别整页刷新
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-nav]');
  if (!a) return;
  e.preventDefault();
  navigate(a.getAttribute('href'));
});

(async () => {
  try {
    const res = await fetch(`${BASE}manifest.json`);
    DATA = await res.json();
    V = DATA.build ? `?v=${DATA.build}` : '';
    for (const m of DATA.icons) byId.set(m.id, m);
    try {
      lang = localStorage.getItem('icon-lang') || lang;
    } catch {}
    applyI18n();
    syncFromUrl();
  } catch (err) {
    document.querySelector('main').innerHTML = `<p class="empty">${t('empty')}</p>`;
  }
})();
