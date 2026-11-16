// 校验 catalog.tsv 与 icons/ 是否一一对应,生成 src/gen.ts(图标字节 + 元数据)。
// 用法:node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CATALOG = join(ROOT, 'catalog.tsv');
const ICONS_DIR = join(ROOT, 'icons');
const OUT = join(ROOT, 'src/gen.ts');

// 每个分类的出处与许可 —— 图标库的"血缘",页面上要显示
const CATS = {
  aws: { title: 'AWS', source: 'mingrammer/diagrams', license: 'Apache-2.0', note: '云厂商官方标识' },
  azure: { title: 'Azure', source: 'mingrammer/diagrams', license: 'Apache-2.0', note: '云厂商官方标识' },
  gcp: { title: 'GCP', source: 'mingrammer/diagrams', license: 'Apache-2.0', note: '云厂商官方标识' },
  infra: { title: '通用基础设施', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '通用概念,彩色填充' },
  org: { title: '公司与机构', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '自绘抽象符号,不含任何商标图形' },
};

const MIME = { svg: 'image/svg+xml', png: 'image/png' };

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
    const id = `x-${catName}:${concept}`;
    if (found.has(id)) {
      console.error(`id 重复: ${id}`);
      process.exit(1);
    }
    found.set(id, `icons/${catName}/${f}`);
  }
}

// ---- 双向校验 ----
let bad = 0;
for (const id of found.keys()) {
  if (!catalog.has(id)) {
    console.error(`catalog.tsv 缺一行: ${id}\t(自己补一行描述)`);
    bad++;
  }
}
for (const id of catalog.keys()) {
  if (!found.has(id)) {
    console.error(`catalog.tsv 里的 ${id} 没有对应文件`);
    bad++;
  }
}
if (bad) process.exit(1);

// ---- 生成 src/gen.ts ----
const metas = [];
const blobs = {};
for (const [id, file] of [...found].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const buf = readFileSync(join(ROOT, file));
  const ext = file.split('.').pop();
  if (ext === 'svg' && !/<svg[\s>]/.test(buf.toString('utf8'))) {
    console.error(`${file}: 不是 SVG`);
    process.exit(1);
  }
  if (ext === 'png' && buf[0] !== 0x89) {
    console.error(`${file}: 不是 PNG`);
    process.exit(1);
  }
  const cat = id.slice(2, id.indexOf(':'));
  const concept = id.slice(id.indexOf(':') + 1);
  const rel = file.replace(/^icons\//, '');
  blobs[file] = buf.toString('base64');
  metas.push({
    id,
    cat,
    concept,
    desc: catalog.get(id),
    file,
    path: `i/${rel}`,
    mime: MIME[ext],
    bytes: buf.length,
    source: CATS[cat].source,
    license: CATS[cat].license,
    note: CATS[cat].note,
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

const body = `// 生成物,别手改 —— 由 scripts/build.mjs 从 catalog.tsv + icons/ 生成。
// 图标字节以 base64 内嵌,Worker 直接吐文件,不依赖外链。

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
}

export interface CatMeta {
  cat: string;
  title: string;
  source: string;
  license: string;
  note: string;
  count: number;
}

export const ICONS: IconMeta[] = ${JSON.stringify(metas, null, 2)};

export const CATS: CatMeta[] = ${JSON.stringify(cats, null, 2)};

/** 相对路径 → base64 内容 */
export const BLOBS: Record<string, string> = ${JSON.stringify(blobs, null, 2)};
`;
writeFileSync(OUT, body);
console.log(`src/gen.ts: ${metas.length} icons, ${cats.length} categories, ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`);

// ---- 静态站(dist/):本地预览 / 静态托管用 ----
const DIST = join(ROOT, 'dist');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'i'), { recursive: true });
writeFileSync(join(DIST, 'manifest.json'), JSON.stringify({ cats, icons: metas }, null, 2));
for (const m of metas) {
  const dest = join(DIST, 'i', m.cat, m.concept + '.' + m.file.split('.').pop());
  mkdirSync(join(DIST, 'i', m.cat), { recursive: true });
  copyFileSync(join(ROOT, m.file), dest);
}
for (const f of ['style.css', 'app.js']) copyFileSync(join(ROOT, 'site', f), join(DIST, f));
writeFileSync(
  join(DIST, 'index.html'),
  readFileSync(join(ROOT, 'site/index.html'), 'utf8').replace('__ICON_BASE__/', '/'),
);
console.log(`dist/: 静态站(本地预览用)`);

// ---- Worker 用的页面:把 CSS/JS 内联成一个字符串(src/page.ts) ----
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

