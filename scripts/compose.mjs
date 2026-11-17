// 用基本符号组装图标。
//
// 基本符号(对象 + 修饰)是唯一出处,symbols/ 下各画一次;
// symbols/recipes.tsv 写"哪个概念 = 哪些符号叠起来",这里拼成 24×24 的 SVG,
// 写进 icons/<cat>/<version>/。改一个符号,全库跟着变 —— 不会走样。
//
// 构图规范 v3 —— 一个图标 = 对象(大,居中偏左)+ 修饰(大,右上角,叠在对象上)。
//   对象 = 这个概念作用在什么上(db:lock 的对象是数据库圆柱,db:index 的对象是表)
//   修饰 = 状态或动作(锁 / 时钟 / 对勾 / 同步),全库共用一套,同一个符号只画一次
//   分类(db: / sec: / k8s:)只活在键名里,不再画进图形 —— 右下角留空给将来的计数徽标
//
// part 的写法:
//   obj/<name>        读 symbols/obj/<name>.svg,套对象槽位
//   mod/<name>        读 symbols/mod/<name>.svg,套修饰槽位
//   mod/<name>@solo   同一个文件,套单元素槽位(居中放大)
//   其它前缀         原样拼进去(旧规则的 glyph/… / corner/…)
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

// 槽位 —— 符号画在自己的规范框里,compose 负责摆位。
//   obj   14×14 框(坐标 0..14),translate(1.2 6.2)  → x 1.2–15.2, y 6.2–20.2
//   mod   12×12 框(坐标 0..12),translate(8.8 1.8)  → x 8.8–20.8, y 1.8–13.8
//   solo  单元素(整个图标就它一个)—— 居中放大,框多大按比例缩
// 对象在左下、修饰在右上,两者重叠得实 —— 修饰符是「压在对象上」,不是并排两个。
const SLOTS = {
  obj: { box: 14, transform: 'translate(1.2 6.2)' },
  mod: { box: 12, transform: 'translate(8.8 1.8)' },
};
const SOLO = 17.4; // 单元素放大到多少(24 的画布里占多大)

// 取一个符号文件的内部内容(剥掉 <svg> 外壳),并把 @role.key 换成色板里的颜色
function inner(file) {
  const path = join(SYMBOLS, `${file}.svg`);
  if (!existsSync(path)) {
    console.error(`compose: 找不到符号 ${file}.svg`);
    process.exit(1);
  }
  const s = readFileSync(path, 'utf8');
  const m = s.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  // 符号文件都是单行的 —— 拼出来的图标也必须是单行(sprite 一行一个 symbol)
  let body = (m ? m[1] : s).trim().replace(/\s*\n\s*/g, ' ');
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

// 把一个 part 变成 SVG 片段
//   obj/<name> / mod/<name> 走槽位
//   obj/<name>@solo / mod/<name>@solo 单元素 —— 居中放大
//   其它前缀原样拼进去(旧规则的 glyph/… / corner/…)
function part(src) {
  const m = src.match(/^(obj|mod)\/([a-z0-9-]+)(@(solo))?$/);
  if (!m) return inner(src);
  const [, kind, name, , solo] = m;
  const box = SLOTS[kind].box;
  const body = inner(`${kind}/${name}`);
  // 单元素:按框的大小等比放大到 SOLO,居中放
  const transform = solo
    ? `translate(${((24 - SOLO) / 2).toFixed(3)} ${((24 - SOLO) / 2).toFixed(3)}) scale(${(SOLO / box).toFixed(4)})`
    : SLOTS[kind].transform;
  return `<g transform="${transform}">${body}</g>`;
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
  const body = parts.map(part).join('');
  // 单行 —— 合并成 sprite 时一行就是一个 symbol
  writeFileSync(
    join(dir, `${concept}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${body}</svg>\n`,
  );
  n++;
}
console.log(`compose: ${n} 个图标由基本符号组装`);
