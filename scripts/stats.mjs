// 资产统计:发出去的东西有多大、什么时候会被下。
//
// 跑法:node scripts/stats.mjs   (要先 npm run build)
// 输出的是 README 里那张表 —— 改完图标重跑一次,把数字更新过去。
import { brotliCompressSync, constants } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const P = join(ROOT, 'public/icon');
const br = (b) => brotliCompressSync(b, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const kb = (x) => (x / 1024).toFixed(0) + ' KB';
const mb = (x) => (x / 1048576).toFixed(1) + ' MB';
const size = (x) => (x > 1048576 ? mb(x) : kb(x));

const walk = (d, out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

// ---- 按类型归堆 ----
const groups = new Map([
  ['index.json', []],
  ['manifest.star.json', []],
  ['sprite.star.svg', []],
  ['manifest.json', []],
  ['manifest.zh.json', []],
  ['manifest.<cat>.json', []],
  ['sprite.<cat>.<k>.svg', []],
  ['i/<cat>/**/*.svg', []],
]);
for (const f of walk(P)) {
  const b = f.split('/').pop();
  const key =
    b === 'index.json' ? 'index.json'
    : b === 'manifest.star.json' ? 'manifest.star.json'
    : b === 'sprite.star.svg' ? 'sprite.star.svg'
    : b === 'manifest.json' ? 'manifest.json'
    : b === 'manifest.zh.json' ? 'manifest.zh.json'
    : /^manifest\..*\.json$/.test(b) ? 'manifest.<cat>.json'
    : /^sprite\..*\.svg$/.test(b) ? 'sprite.<cat>.<k>.svg'
    : 'i/<cat>/**/*.svg';
  groups.get(key).push(f);
}

console.log('### 资产统计\n');
console.log('| 资产 | 文件数 | 原始 | 压后(brotli) |');
console.log('| --- | ---: | ---: | ---: |');
let tr = 0;
let tb = 0;
for (const [k, list] of groups) {
  let raw = 0;
  let b = 0;
  for (const f of list) {
    const buf = readFileSync(f);
    raw += buf.length;
    b += br(buf);
  }
  tr += raw;
  tb += b;
  console.log(`| \`${k}\` | ${list.length} | ${size(raw)} | ${size(b)} |`);
}
console.log(`| **合计** | **${[...groups.values()].reduce((a, l) => a + l.length, 0)}** | **${size(tr)}** | **${size(tb)}** |\n`);

// ---- 各分类的规模 ----
const cats = readdirSync(join(P, 'i'));
const rows = [];
for (const cat of cats) {
  const list = walk(join(P, 'i', cat));
  let raw = 0;
  let b = 0;
  for (const f of list) {
    const buf = readFileSync(f);
    raw += buf.length;
    b += br(buf);
  }
  const shards = readdirSync(P).filter((f) => f.startsWith(`sprite.${cat}.`)).length;
  rows.push({ cat, n: list.length, raw, br: b, shards });
}
rows.sort((a, b) => b.br - a.br);
console.log('### 各分类的规模\n');
console.log('| 分类 | 图标 | 原始 | 压后 | 片数 |');
console.log('| --- | ---: | ---: | ---: | ---: |');
for (const r of rows) console.log(`| \`${r.cat}\` | ${r.n} | ${size(r.raw)} | ${size(r.br)} | ${r.shards} |`);
console.log(
  `| **合计** | **${rows.reduce((a, r) => a + r.n, 0)}** | **${size(rows.reduce((a, r) => a + r.raw, 0))}** | **${size(rows.reduce((a, r) => a + r.br, 0))}** | **${rows.reduce((a, r) => a + r.shards, 0)}** |`,
);
