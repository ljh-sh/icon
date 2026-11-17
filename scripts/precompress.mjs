// 部署时压一遍:大文本资源生成 .br,跟原始文件一起上传到 CF。
//
// 仓里只放文本 —— public/ 是构建产物(.gitignore 掉了),压缩是"上传到 CF"
// 这一步的事,不是仓里的东西。
//
// 用法:node scripts/precompress.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

const ROOT = new URL('..', import.meta.url).pathname;
const RAW = join(ROOT, 'public/icon/_raw');
const MIN = 40 * 1024; // 小于这个的不值得压

if (!statSync(RAW, { throwIfNoEntry: false })) {
  console.log('precompress: 没有 _raw 目录,跳过');
  process.exit(0);
}

let n = 0;
for (const name of readdirSync(RAW)) {
  const f = join(RAW, name);
  if (!statSync(f).isFile() || statSync(f).size < MIN) continue;
  const raw = readFileSync(f);
  const br = brotliCompressSync(raw, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
    },
  });
  writeFileSync(`${f}.br`, br);
  n++;
  console.log(
    `precompress: ${name}  ${(raw.length / 1024).toFixed(0)} KB → ${(br.length / 1024).toFixed(0)} KB (br)`
  );
}
console.log(`precompress: ${n} 个文件压好`);
