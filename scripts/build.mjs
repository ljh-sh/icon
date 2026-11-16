// 校验 catalog.tsv 与 icons/ 是否一一对应,生成:
//   src/gen.ts            —— Worker 需要的精简元数据(id → 文件、许可结论)
//   public/icon/          —— 静态资源(图标文件 + manifest.json),边缘直接发
//   dist/                 —— 本地预览用的静态站
//
// 用法:node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CATALOG = join(ROOT, 'catalog.tsv');
const ICONS_DIR = join(ROOT, 'icons');
const OUT = join(ROOT, 'src/gen.ts');
const PUBLIC = join(ROOT, 'public/icon');

// 每个分类的出处与许可 —— 图标库的"血缘",页面上要显示
const CATS = {
  aws: { title: 'AWS', source: 'mingrammer/diagrams', license: 'Apache-2.0', note: '云厂商官方标识' },
  azure: { title: 'Azure', source: 'mingrammer/diagrams', license: 'Apache-2.0', note: '云厂商官方标识' },
  gcp: { title: 'GCP', source: 'mingrammer/diagrams', license: 'Apache-2.0', note: '云厂商官方标识' },
  infra: { title: '通用基础设施', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '通用概念,彩色填充' },
  org: { title: '公司与机构', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '自绘抽象符号,不含任何商标图形' },
  // 品牌图形:许可逐个分析,记在 brands/ 里 —— 分类只给个默认说法
  brand: { title: '品牌标识', source: '各品牌官方渠道', license: '按各品牌条款', note: '官方 mark —— 逐个按许可记录' },
  bootstrap: { title: '第三方图标库', source: 'Bootstrap Icons', license: 'MIT(著作权)', note: '整库搬入;画了品牌的那几十个另见许可记录', bulk: true },
  db: { title: '数据库', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '数据库的概念与形态' },
  ai: { title: 'AI', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: 'AI 架构里的通用概念' },
  k8s: { title: 'Kubernetes', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: 'K8s 组件概念(非官方标识)' },
  sec: { title: '安全', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '安全概念' },
  obs: { title: '可观测性', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '指标 / 日志 / 链路' },
  cat: { title: '猫', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '猫' },
  dog: { title: '狗', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '狗' },
  animal: { title: '动物', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '动物' },
  chem: { title: '化学', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '化学与分子' },
  circuit: { title: '电路', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '电子与电路' },
  music: { title: '音乐', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '音乐与音频' },
  food: { title: '食物', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '食物与饮品' },
};

// 整库搬入的分类:catalog.tsv 不强制一行一个(几千个图标不可能手写描述)
const BULK = new Set(Object.entries(CATS).filter(([, m]) => m.bulk).map(([c]) => c));
// 品牌图形:逐个要有许可记录或"待审"登记
const NEEDS_RECORD = new Set(['brand', 'bootstrap']);

// 名字像品牌的 —— 兜底:这类图标必须在 brands/trademarks.tsv 里登记
const BRANDISH =
  /^(alipay|amazon|android|anthropic|apple|behance|bing|bootstrap|discord|dribbble|dropbox|facebook|github|gitlab|google|instagram|javascript|linkedin|markdown|meta|microsoft|openai|paypal|pinterest|reddit|sina-weibo|slack|snapchat|spotify|stack-overflow|stripe|telegram|tencent|tiktok|trello|twitter|typescript|unity|vimeo|wechat|whatsapp|wikipedia|windows|wordpress|youtube)/;

const MIME = { svg: 'image/svg+xml', png: 'image/png' };

// ---- 读 brands/*.md 的头部(许可记录) ----
// 头部是 key: value,正文是分析 —— 构建只取头部,页面把正文带出去显示
function parseRecord(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    console.error(`${file}: 缺头部(--- 开始,--- 结束)`);
    process.exit(1);
  }
  const meta = {};
  for (const line of m[1].split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf(':');
    if (i < 0) continue;
    meta[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  if (!meta.id || !meta.verdict) {
    console.error(`${file}: 头部缺 id 或 verdict`);
    process.exit(1);
  }
  if (!['ok', 'caution', 'withheld'].includes(meta.verdict)) {
    console.error(`${file}: verdict 只能是 ok / caution / withheld,现在是 ${meta.verdict}`);
    process.exit(1);
  }
  return { meta, body: text.slice(m[0].length).trim() };
}

const records = new Map(); // id → record
const BRANDS_DIR = join(ROOT, 'brands');
if (existsSync(BRANDS_DIR)) {
  for (const f of readdirSync(BRANDS_DIR).sort()) {
    if (!f.endsWith('.md')) continue;
    const r = parseRecord(join(BRANDS_DIR, f));
    if (records.has(r.meta.id)) {
      console.error(`brands/: id 重复: ${r.meta.id}`);
      process.exit(1);
    }
    records.set(r.meta.id, r);
  }
}

// ---- 读 brands/trademarks.tsv:画了商标的图标清单 ----
// id \t 商标权人 \t 状态(reviewed|pending) \t 备注
const trademarks = new Map(); // id → { owner, status, note }
const TM_FILE = join(BRANDS_DIR, 'trademarks.tsv');
if (existsSync(TM_FILE)) {
  readFileSync(TM_FILE, 'utf8').split('\n').forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const [id, owner, status, ...rest] = t.split('\t');
    if (!id || !status) {
      console.error(`brands/trademarks.tsv:${i + 1} 格式不对(应为 <id>\\t<商标权人>\\t<reviewed|pending>[\\t备注])`);
      process.exit(1);
    }
    if (status !== 'reviewed' && status !== 'pending') {
      console.error(`brands/trademarks.tsv:${i + 1} 状态只能是 reviewed / pending`);
      process.exit(1);
    }
    trademarks.set(id, { owner: owner || '', status, note: rest.join('\t') || '' });
  });
}

// ---- 读 catalog.tsv ----
const catalog = new Map();
const lines = readFileSync(CATALOG, 'utf8').split('\n');
lines.forEach((line, i) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const [id, desc, ...rest] = t.split('\t');
  if (!id || !desc || rest.length) {
    console.error(`catalog.tsv:${i + 1} 格式不对(应为 <id>\\t<desc>): ${line}`);
    process.exit(1);
  }
  if (catalog.has(id)) {
    console.error(`catalog.tsv:${i + 1} id 重复: ${id}`);
    process.exit(1);
  }
  catalog.set(id, desc.trim());
});

// ---- 扫 icons/ ----
const found = new Map(); // id → 相对路径
for (const cat of readdirSync(ICONS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const catName = cat.name;
  if (!CATS[catName]) {
    console.error(`icons/${catName}/ 是不认识的分类 —— 先在 scripts/build.mjs 的 CATS 里登记`);
    process.exit(1);
  }
  for (const f of readdirSync(join(ICONS_DIR, catName)).sort()) {
    const ext = f.split('.').pop();
    if (!MIME[ext]) {
      console.error(`icons/${catName}/${f}: 不支持的格式 .${ext}`);
      process.exit(1);
    }
    const concept = f.slice(0, -(ext.length + 1));
    const id = `${catName}:${concept}`;
    if (found.has(id)) {
      console.error(`id 重复: ${id}`);
      process.exit(1);
    }
    // 品牌图形:清单(trademarks.tsv)为准 —— 清单外的按通用图形处理;
    // 名字像品牌的必须登记,防止漏网。
    if (NEEDS_RECORD.has(catName)) {
      const rec = records.get(id);
      const tm = trademarks.get(id);
      if (rec && rec.meta.verdict === 'withheld') {
        console.log(`跳过 ${id}(记录结论:withheld —— 不发布)`);
        continue;
      }
      if (rec && tm && tm.status !== 'reviewed') {
        console.error(`${id} 有许可记录,但 trademarks.tsv 里状态是 ${tm.status} —— 改成 reviewed`);
        process.exit(1);
      }
      if (!tm && BRANDISH.test(concept)) {
        console.error(`${id} 名字像品牌图标 —— 在 brands/trademarks.tsv 里登记(商标权人 + 状态)`);
        process.exit(1);
      }
    }
    found.set(id, `icons/${catName}/${f}`);
  }
}

// ---- 校验 ----
let bad = 0;
for (const id of found.keys()) {
  if (catalog.has(id)) continue;
  if (BULK.has(id.slice(0, id.indexOf(':')))) continue; // 整库搬入的:描述自动生成
  console.error(`catalog.tsv 缺一行: ${id}\t(自己补一行描述)`);
  bad++;
}
for (const id of catalog.keys()) {
  if (!found.has(id)) {
    console.error(`catalog.tsv 里的 ${id} 没有对应文件`);
    bad++;
  }
}
for (const [id, rec] of records) {
  if (rec.meta.verdict === 'withheld') continue;
  if (!found.has(id)) {
    console.error(`brands/ 里的 ${id} 没有对应图标文件`);
    bad++;
  }
  if (!trademarks.has(id)) {
    console.error(`brands/ 里的 ${id} 没在 brands/trademarks.tsv 登记`);
    bad++;
  }
}
for (const id of trademarks.keys()) {
  if (!found.has(id)) {
    console.error(`brands/trademarks.tsv 里的 ${id} 没有对应图标文件`);
    bad++;
  }
}
if (bad) process.exit(1);

// ---- 生成元数据 ----
const metas = [];
for (const [id, file] of [...found].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const ext = file.split('.').pop();
  const cat = id.slice(0, id.indexOf(':'));
  const concept = id.slice(id.indexOf(':') + 1);
  const rec = records.get(id);
  const tm = trademarks.get(id);
  metas.push({
    id,
    cat,
    concept,
    desc: catalog.get(id) || `${CATS[cat].source} · ${concept.replace(/-/g, ' ')}`,
    file,
    path: `i/${file.replace(/^icons\//, '')}`,
    mime: MIME[ext],
    bytes: readFileSync(join(ROOT, file)).length,
    source: rec?.meta.source || CATS[cat].source,
    license: rec?.meta.license || CATS[cat].license,
    note: rec?.meta.note || CATS[cat].note,
    ...(rec
      ? {
          verdict: rec.meta.verdict,
          trademark: rec.meta.trademarkOwner || tm?.owner || '',
          trademarkPolicy: rec.meta.trademarkPolicy || '',
          licenseUrl: rec.meta.licenseUrl || '',
          restrictions: rec.meta.restrictions || '',
          reviewed: rec.meta.reviewed || '',
          notes: rec.body,
        }
      : tm
        ? { verdict: 'pending', trademark: tm.owner, restrictions: tm.note, notes: '' }
        : {}),
  });
}

const cats = Object.entries(CATS).map(([cat, meta]) => ({
  cat,
  title: meta.title,
  source: meta.source,
  license: meta.license,
  note: meta.note,
  count: metas.filter((m) => m.cat === cat).length,
}));

const BUILD = createHash('sha1')
  .update(metas.map((m) => `${m.id}:${m.bytes}`).join('\n'))
  .digest('hex')
  .slice(0, 10);

const manifest = { build: BUILD, cats, icons: metas };

// ---- src/gen.ts:Worker 用的精简数据(不嵌字节,图标走静态资源) ----
const id2file = {};
for (const m of metas) id2file[m.id] = m.path;
const licMeta = {};
for (const m of metas) {
  if (!m.verdict) continue;
  licMeta[m.id] = {
    verdict: m.verdict,
    trademark: m.trademark || '',
    license: m.license,
    source: m.source,
  };
}

const body = `// 生成物,别手改 —— 由 scripts/build.mjs 生成。
// 图标文件不走这里:静态资源(public/icon/i/**)由边缘直接发,Worker 只管清单与接口。

export interface IconMeta {
  id: string;
  cat: string;
  concept: string;
  desc: string;
  file: string;
  path: string;
  mime: string;
  bytes: number;
  source: string;
  license: string;
  note: string;
  /** 许可结论:ok / caution / pending / withheld */
  verdict?: string;
  trademark?: string;
  trademarkPolicy?: string;
  licenseUrl?: string;
  restrictions?: string;
  reviewed?: string;
  notes?: string;
}

export interface CatMeta {
  cat: string;
  title: string;
  source: string;
  license: string;
  note: string;
  count: number;
}

export const CATS: CatMeta[] = ${JSON.stringify(cats, null, 2)};

/** id → 静态资源路径 */
export const ID2FILE: Record<string, string> = ${JSON.stringify(id2file, null, 2)};

/** 有许可结论的图标(其余是通用图形) */
export const LICENSE: Record<string, { verdict: string; trademark: string; license: string; source: string }> = ${JSON.stringify(licMeta, null, 2)};

/** 构建号:内容一变就变 */
export const BUILD = '${BUILD}';
`;
writeFileSync(OUT, body);
console.log(`src/gen.ts: ${metas.length} icons, ${cats.length} categories`);

// ---- public/icon/ 静态资源:图标文件 + manifest(边缘直接发) ----
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
for (const m of metas) {
  const dest = join(PUBLIC, m.path);
  mkdirSync(join(dest, '..'), { recursive: true });
  copyFileSync(join(ROOT, m.file), dest);
}
writeFileSync(join(PUBLIC, 'manifest.json'), JSON.stringify(manifest));
// 缓存策略:图标文件长缓存(URL 上带构建号,重新部署即失效),清单短缓存
writeFileSync(
  join(ROOT, 'public/_headers'),
  `/icon/i/*\n  Cache-Control: public, max-age=3600\n\n/icon/manifest.json\n  Cache-Control: public, max-age=300\n`,
);
console.log(`public/icon/: ${metas.length} 个文件 + manifest.json`);

// ---- dist/:本地预览用的静态站 ----
const DIST = join(ROOT, 'dist');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'i'), { recursive: true });
writeFileSync(join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
for (const m of metas) {
  const dest = join(DIST, m.path);
  mkdirSync(join(dest, '..'), { recursive: true });
  copyFileSync(join(ROOT, m.file), dest);
}
for (const f of ['style.css', 'app.js']) copyFileSync(join(ROOT, 'site', f), join(DIST, f));
writeFileSync(
  join(DIST, 'index.html'),
  readFileSync(join(ROOT, 'site/index.html'), 'utf8').replace('__ICON_BASE__/', '/'),
);
console.log(`dist/: 静态站(本地预览用)`);

// ---- Worker 用的页面:CSS/JS 内联成字符串(src/page.ts) ----
// 内联是为了绕开 wrangler 的 Text 模块规则(.js 默认按 ESModule 处理)。
const css = readFileSync(join(ROOT, 'site/style.css'), 'utf8');
const js = readFileSync(join(ROOT, 'site/app.js'), 'utf8');
const inline = (html) =>
  html
    .replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`)
    .replace('<script src="app.js"></script>', `<script>\n${js}\n</script>`);
const page = inline(readFileSync(join(ROOT, 'site/index.html'), 'utf8'));
writeFileSync(
  join(ROOT, 'src/page.ts'),
  `// 生成物,别手改 —— 由 scripts/build.mjs 生成:CSS/JS 内联后的页面。\nexport const PAGE = ${JSON.stringify(page)};\n`,
);
console.log(`src/page.ts: ${(page.length / 1024).toFixed(0)} KB`);
