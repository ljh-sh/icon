// 用基本符号组装图标。
//
// 基本符号(主体 + 角标 + 修饰符)是唯一出处,symbols/ 下各画一次;
// symbols/recipes.tsv 写"哪个概念 = 哪些符号叠起来",这里拼成 24×24 的 SVG,
// 写进 icons/<cat>/<version>/。改一个符号,全库跟着变 —— 不会走样。
//
// 用法:node scripts/compose.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SYMBOLS = join(ROOT, 'symbols');
const RECIPES = join(SYMBOLS, 'recipes.tsv');

if (!existsSync(RECIPES)) {
  console.log('compose: 没有 symbols/recipes.tsv,跳过');
  process.exit(0);
}

// 取一个符号文件的内部内容(剥掉 <svg> 外壳)
function inner(file) {
  const path = join(SYMBOLS, `${file}.svg`);
  if (!existsSync(path)) {
    console.error(`compose: 找不到符号 ${file}.svg`);
    process.exit(1);
  }
  const s = readFileSync(path, 'utf8');
  const m = s.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return (m ? m[1] : s).trim().replace(/\n\s*/g, '\n  ');
}

let n = 0;
for (const line of readFileSync(RECIPES, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const [target, concept, ...parts] = t.split('\t');
  if (!target || !concept || !parts.length) {
    console.error(`compose: 配方格式不对(应为 <cat>/<version>\t<concept>\t<part>…): ${t}`);
    process.exit(1);
  }
  const [cat, version] = target.split('/');
  if (!cat || !version) {
    console.error(`compose: 目标格式不对(应为 <cat>/<version>): ${target}`);
    process.exit(1);
  }
  const dir = join(ROOT, 'icons', cat, version);
  mkdirSync(dir, { recursive: true });
  const body = parts.map(inner).join('\n  ');
  writeFileSync(
    join(dir, `${concept}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">\n  ${body}\n</svg>\n`,
  );
  n++;
}
console.log(`compose: ${n} 个图标由基本符号组装`);
