// x-cmd/icon 查询页。
// 路由:/            首页(分类 + 全部图标,可过滤)
//      /c/<cat>    某个分类的完整列表
//      /c/<cat>#<id>  定位到分类里的某个图标
const BASE = new URL('.', document.baseURI).pathname; // '/icon/' 或 '/'

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

let DATA = { cats: [], icons: [] };
let q = '';
let hitId = null;

// 图标 URL 带上构建号:重新部署后 URL 变了,边缘缓存不会顶着旧图
let V = '';
const iconUrl = (m) => `${BASE}${m.path}${V}`;
const byId = new Map();

function match(m) {
  if (!q) return true;
  const hay = `${m.id} ${m.desc} ${m.cat} ${m.concept}`.toLowerCase();
  return hay.includes(q);
}

function cell(m) {
  const c = el('div', 'cell');
  c.dataset.id = m.id;
  c.title = m.desc;
  const img = el('img');
  img.src = iconUrl(m);
  img.alt = m.id;
  img.loading = 'lazy';
  c.append(img, el('div', 'id', m.id));
  if (m.verdict === 'caution') c.append(el('span', 'vflag caution', '谨慎'));
  if (m.verdict === 'pending') c.append(el('span', 'vflag pending', '未审'));
  c.append(el('div', 'desc', m.desc));
  c.addEventListener('click', () => onCell(m));
  return c;
}

function grid(host, list) {
  host.textContent = '';
  const shown = list.filter(match);
  for (const m of shown) host.append(cell(m));
  return shown.length;
}

function renderCats() {
  const host = $('#cats');
  host.textContent = '';
  for (const cat of DATA.cats) {
    const a = el('a', 'cat-card');
    a.href = `${BASE}c/${cat.cat}`;
    a.append(el('h3', null, cat.title), el('div', 'n', `${cat.count} 个图标`));
    const pv = el('div', 'preview');
    for (const m of DATA.icons.filter((x) => x.cat === cat.cat).slice(0, 8)) {
      const img = el('img');
      img.src = iconUrl(m);
      img.alt = m.id;
      img.loading = 'lazy';
      pv.append(img);
    }
    a.append(pv, el('div', 'src', `${cat.source} · ${cat.license} · ${cat.note}`));
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(`${BASE}c/${cat.cat}`);
    });
    host.append(a);
  }
}

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
    const meta = DATA.cats.find((c) => c.cat === cat);
    $('#cat-title').textContent = meta ? meta.title : cat;
    $('#cat-note').textContent = meta
      ? `${meta.count} 个图标 · 出处 ${meta.source} · 许可 ${meta.license} · ${meta.note}`
      : '';
    const list = DATA.icons.filter((m) => m.cat === cat);
    const n = grid($('#cat-grid'), list);
    $('#empty').hidden = n > 0;
    $('#empty').textContent = list.length ? '没有匹配的图标。' : '这个分类还没有图标。';
  } else {
    catp.hidden = true;
    home.hidden = false;
    const n = grid($('#all'), DATA.icons);
    $('#all-count').textContent = `${n} / ${DATA.icons.length}`;
    $('#empty').hidden = n > 0;
    $('#empty').textContent = '没有匹配的图标。';
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
  render();
  window.scrollTo({ top: 0 });
}

function onCell(m) {
  const u = new URL(`${BASE}c/${m.cat}`, location.origin);
  u.hash = encodeURIComponent(m.id);
  if (q) u.searchParams.set('q', q);
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
const VERDICT_TEXT = { ok: '可用', caution: '谨慎 —— 限指示性引用', pending: '未审 —— 商标条款未逐条核对' };

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
  $('#dlg-img').src = iconUrl(m);
  $('#dlg-img').alt = m.id;
  $('#dlg-id').textContent = m.id;
  $('#dlg-desc').textContent = m.desc;
  $('#dlg-cat').textContent = (DATA.cats.find((c) => c.cat === m.cat) || {}).title || m.cat;
  $('#dlg-source').textContent = m.source;
  row('#dlg-license', m.license);
  row('#dlg-trademark', m.trademark);
  row('#dlg-restrictions', (m.restrictions || '').replace(/;/g, '; '));
  row('#dlg-reviewed', m.reviewed);

  const v = $('#dlg-verdict');
  const vdd = v.closest('dd');
  if (m.verdict) {
    vdd.hidden = false;
    v.textContent = VERDICT_TEXT[m.verdict] || m.verdict;
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
  a.href = iconUrl(m);
  a.download = m.file.replace(/^.*\//, '');
  const wrap = $('#dlg-src-wrap');
  if (m.mime === 'image/svg+xml') {
    wrap.hidden = false;
    $('#dlg-src').textContent = '加载中…';
    try {
      const txt = await (await fetch(iconUrl(m))).text();
      $('#dlg-src').textContent = txt;
    } catch {
      $('#dlg-src').textContent = '(取不到源码)';
    }
  } else {
    wrap.hidden = true;
  }
  if (!dlg.open) dlg.showModal();
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
    btn.textContent = '已复制';
    setTimeout(() => (btn.textContent = '复制'), 1200);
  } catch {
    btn.textContent = '复制失败';
  }
});

/* ---------- 搜索 / 键盘 ---------- */
const qEl = $('#q');
function setQuery(v, push) {
  q = v.trim().toLowerCase();
  qEl.value = v;
  $('#clear').hidden = !q;
  const url = new URL(location.href);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  history[push ? 'pushState' : 'replaceState']({}, '', url);
  render();
}
qEl.addEventListener('input', () => setQuery(qEl.value, false));
$('#clear').addEventListener('click', () => {
  setQuery('', false);
  qEl.focus();
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== qEl && !dlg.open) {
    e.preventDefault();
    qEl.focus();
    qEl.select();
  }
  if (e.key === 'Escape' && document.activeElement === qEl) qEl.blur();
});

/* ---------- 主题 ---------- */
const themeBtn = $('#theme');
function applyTheme(t) {
  if (t) document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem('icon-theme', t || ''); } catch {}
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
  const v = new URL(location.href).searchParams.get('q') || '';
  q = v.trim().toLowerCase();
  qEl.value = v;
  $('#clear').hidden = !q;
  render();
}
window.addEventListener('popstate', syncFromUrl);
window.addEventListener('hashchange', locate);

(async () => {
  try {
    const res = await fetch(`${BASE}manifest.json`);
    DATA = await res.json();
    V = DATA.build ? `?v=${DATA.build}` : '';
    for (const m of DATA.icons) byId.set(m.id, m);
    renderCats();
    syncFromUrl();
  } catch (err) {
    document.querySelector('main').innerHTML =
      '<p class="empty">图标清单取不到(manifest.json)。</p>';
  }
})();
