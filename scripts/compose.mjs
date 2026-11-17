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
// 色板 —— 角色的唯一出处,符号里写 @role.key,这里换成实际颜色
const palette = JSON.parse(readFileSync(join(SYMBOLS, 'palette.json'), 'utf8'));

if (!existsSync(RECIPES)) {
  console.log('compose: 没有 symbols/recipes.tsv,跳过');
  process.exit(0);
}

// 取一个符号文件的内部内容(剥掉 <svg> 外壳),并把 @role.key 换成色板里的颜色
function inner(file) {
  const path = join(SYMBOLS, `${file}.svg`);
  if (!existsSync(path)) {
    console.error(`compose: 找不到符号 ${file}.svg`);
    process.exit(1);
  }
  const s = readFileSync(path, 'utf8');
  const m = s.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  let body = (m ? m[1] : s).trim().replace(/\n\s*/g, '\n  ');
  body = body.replace(/@([a-z-]+)\.([a-z]+)/g, (whole, role, key) => {
    const hex = palette[role]?.[key];
    if (!hex) {
      console.error(`compose: ${file}.svg 用了色板里没有的颜色 ${whole}`);
      process.exit(1);
    }
    return hex;
  });
  return body;
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
