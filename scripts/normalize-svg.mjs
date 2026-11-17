// 把 SVG 压成单行。
//
// 图标文件一律单行 —— sprite 一行一个 symbol,合并、grep、diff 都靠这个。
// 写完 SVG 跑一下这个(或 npm run fmt),构建时也会检查:不是单行直接报错。
//
// 用法:node scripts/normalize-svg.mjs [路径…]
//       不给路径就处理 symbols/ 与 icons/ 下的全部 .svg
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

// 标签之间的换行不留痕迹,其余换行折成空格 —— 图形本身不动
export function oneLine(src) {
  return (
    src
      .replace(/\r\n/g, '\n')
      .replace(/>\s*\n\s*</g, '><') // 标签之间不留空白
      .replace(/\s*\n\s*/g, ' ') // 其余换行折成空格
      .replace(/ {2,}/g, ' ')
      .trim() + '\n'
  );
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.svg')) out.push(p);
  }
  return out;
}

const args = process.argv.slice(2);
const targets = args.length ? args : [join(ROOT, 'symbols'), join(ROOT, 'icons')];
const files = [];
for (const t of targets) {
  const p = t.startsWith('/') ? t : join(ROOT, t);
  if (!statSync(p).isDirectory()) files.push(p);
  else walk(p, files);
}

let n = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const out = oneLine(src);
  if (out !== src) {
    writeFileSync(f, out);
    n++;
  }
}
console.log(`normalize: ${n} 个文件改成单行(共 ${files.length} 个)`);
