// 校验 catalog.tsv 与 icons/ 是否一一对应,生成:
//   src/gen.ts            —— Worker 需要的精简元数据(id → 文件、许可结论)
//   public/icon/          —— 静态资源(图标文件 + manifest.json),边缘直接发
//   dist/                 —— 本地预览用的静态站
//
// 用法:node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { brotliCompressSync, constants } from 'node:zlib';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CATALOG = join(ROOT, 'catalog.tsv');
const ICONS_DIR = join(ROOT, 'icons');
const OUT = join(ROOT, 'src/gen.ts');
const PUBLIC = join(ROOT, 'public/icon');

// 每个分类的出处与许可 —— 图标库的"血缘",页面上要显示
// title/note 是中文,titleEn/noteEn 是英文 —— 页面按语言取其一
const CATS = {
  aws: { title: 'AWS', titleEn: 'AWS', source: 'AWS 官方架构图标包', license: '厂商图标包(商标归 AWS)', note: 'AWS 官方服务标识,原样 SVG', noteEn: 'Official AWS service icons, SVG as published' },
  azure: { title: 'Azure', titleEn: 'Azure', source: 'Microsoft Azure 官方图标包', license: '厂商图标包(商标归 Microsoft)', note: 'Azure 官方服务标识,原样 SVG', noteEn: 'Official Azure service icons, SVG as published' },
  gcp: { title: 'GCP', titleEn: 'GCP', source: 'Google Cloud 官方图标集', license: '厂商图标包(商标归 Google)', note: 'Google Cloud 官方产品标识,原样 SVG', noteEn: 'Official Google Cloud product icons, SVG as published' },
  infra: { title: '通用基础设施', titleEn: 'Infrastructure', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '通用概念,彩色填充', noteEn: 'Generic concepts, filled in colour' },
  org: { title: '公司与机构', titleEn: 'Organizations', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '自绘抽象符号,不含任何商标图形', noteEn: 'Self-drawn abstract symbols, no trademark artwork' },
  // 品牌图形:许可逐个分析,记在 brands/ 里 —— 分类只给个默认说法
  brand: { title: '品牌标识', titleEn: 'Brand Marks', source: '官方渠道 / Simple Icons(CC0) / Wikimedia Commons', license: '按各品牌条款', note: '常用品牌图形 —— 官方优先,拿不到用 CC0 图标库;逐个按许可记录', noteEn: 'Official sources first, then CC0 or public-domain templates; each one reviewed', mono: true },
  bootstrap: { title: 'Bootstrap', titleEn: 'Bootstrap', source: 'Bootstrap Icons', license: 'MIT(著作权)', note: '整库搬入;画了品牌的那几十个另见许可记录', noteEn: 'Bootstrap Icons, imported whole; the branded ones are reviewed separately', bulk: true, mono: true },
  db: { title: '数据库', titleEn: 'Databases', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '数据库的概念与形态', noteEn: 'Database concepts and shapes' },
  ai: { title: 'AI', titleEn: 'AI', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: 'AI 架构里的通用概念', noteEn: 'Common concepts in AI architectures' },
  k8s: { title: 'Kubernetes', titleEn: 'Kubernetes', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: 'K8s 组件概念(非官方标识)', noteEn: 'K8s component concepts (not official marks)' },
  sec: { title: '安全', titleEn: 'Security', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '安全概念', noteEn: 'Security concepts' },
  obs: { title: '可观测性', titleEn: 'Observability', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '指标 / 日志 / 链路', noteEn: 'Metrics, logs and traces' },
  cat: { title: '猫', titleEn: 'Cats', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '猫', noteEn: 'Cats' },
  dog: { title: '狗', titleEn: 'Dogs', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '狗', noteEn: 'Dogs' },
  animal: { title: '动物', titleEn: 'Animals', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '动物', noteEn: 'Animals' },
  phy: { title: '物理', titleEn: 'Physics', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '物理概念与微观结构 —— 原子 / 分子 / 键 / 晶体结构 / 力学 / 电磁 / 光学', noteEn: 'Physics concepts — atoms, molecules, structures, mechanics, EM, optics' },
  mech: { title: '机械', titleEn: 'Machinery', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '机器上的零件 —— 齿轮 / 轴承 / 阀门 / 泵 / 涡轮', noteEn: 'Machine parts — gears, bearings, valves, pumps, turbines' },
  military: { title: '军事', titleEn: 'Military', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '海军 / 空军 / 陆军的通用装备符号 —— 不指向任何国家的具体部队', noteEn: 'Generic navy, air force and ground force unit symbols' },
  chem: { title: '化学', titleEn: 'Chemistry', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '化学:实验器材 / 试剂 / 结构', noteEn: 'Chemistry: lab equipment, reagents and structures' },
  dev: { title: '开发流程', titleEn: 'Development', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '开发项目流程 —— 通用阶段 / 软件 / 硬件', noteEn: 'Development workflow — phases, software and hardware' },
  github: { title: 'GitHub', titleEn: 'GitHub', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: 'GitHub 的概念与流程 —— 右下角是 GitHub 官方 mark(次要位置)', noteEn: 'GitHub concepts and flows — official mark in a secondary position' },
  circuit: { title: '电路', titleEn: 'Circuits', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '电子与电路', noteEn: 'Electronics and circuits' },
  music: { title: '音乐', titleEn: 'Music', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '音乐与音频', noteEn: 'Music and audio' },
  food: { title: '食物', titleEn: 'Food', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '食物与饮品', noteEn: 'Food and drink' },
  programming: { title: '语言与框架', titleEn: 'Languages & Frameworks', source: 'Simple Icons', license: 'CC0', note: '编程语言与 Web 框架的标识', noteEn: 'Programming languages and web frameworks' },
  firebase: { title: 'Firebase', titleEn: 'Firebase', source: 'Simple Icons', license: 'CC0', note: 'Firebase 的产品标识', noteEn: 'Firebase product marks' },
  elastic: { title: 'Elastic', titleEn: 'Elastic', source: 'Simple Icons', license: 'CC0', note: 'Elastic Stack 的产品标识', noteEn: 'Elastic Stack product marks' },
  digitalocean: { title: 'DigitalOcean', titleEn: 'DigitalOcean', source: 'Simple Icons', license: 'CC0', note: 'DigitalOcean 的产品标识', noteEn: 'DigitalOcean product marks' },
  network: { title: '网络设备', titleEn: 'Network Devices', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '交换机 / 路由器 / 防火墙 / 机架 这类设备与符号 —— 自绘的抽象图形', noteEn: 'Switches, routers, firewalls, racks — self-drawn abstract shapes' },
  base: { title: '底座', titleEn: 'Bases', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '上面放东西的台面 —— 内容区在底座之上', noteEn: 'Pedestals and slabs — content sits on top' },
  frame: { title: '框架', titleEn: 'Frames', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '框在外、内容在里面的框架型图标 —— 屏 / 白板 / 门 / 云 / 地图', noteEn: 'Containers with room inside — screens, boards, doors, clouds, maps' },
  common: { title: '通用符号', titleEn: 'Common Symbols', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '全库共用的基本符号 —— 锁 / 时钟 / 对勾 / 同步', noteEn: 'Basic symbols shared across the library — lock, clock, check, sync' },
  travel: { title: '旅行', titleEn: 'Travel', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '旅行攻略里用得上的东西 —— 行李 / 证件 / 住宿 / 景点 / 路线', noteEn: 'What a travel guide needs — luggage, documents, stays, sights, routes' },
  nutrition: { title: '营养', titleEn: 'Nutrition', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '营养成分与膳食 —— 热量 / 蛋白质 / 脂肪 / 维生素', noteEn: 'Nutrients and diet — calories, protein, fat, vitamins' },
  transport: { title: '交通工具', titleEn: 'Transport', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '日常出行的交通工具 —— 车 / 船 / 飞机 / 轨道交通', noteEn: 'Everyday vehicles — cars, ships, planes, rail' },
  aliyun: { title: '阿里云', titleEn: 'Alibaba Cloud', source: '阿里云官方矢量图标包(2022 橙)', license: '厂商图标包(商标归阿里云)', note: '阿里云官方服务标识,原样 SVG', noteEn: 'Official Alibaba Cloud service icons, SVG as published' },
  oci: { title: 'Oracle 云', titleEn: 'Oracle Cloud', source: 'Oracle OCI 官方架构图标包(V24.2)', license: '厂商图标包(商标归 Oracle)', note: 'Oracle 云基础设施官方服务标识,原样 SVG', noteEn: 'Official Oracle Cloud Infrastructure service icons, SVG as published' },
  ibm: { title: 'IBM 云', titleEn: 'IBM Cloud', source: 'IBM Cloud 官方架构图标包(architecture-icons)', license: '厂商图标包(商标归 IBM)', note: 'IBM Cloud 官方架构图标,原样 SVG', noteEn: 'Official IBM Cloud architecture icons, SVG as published' },
  iconpark: { title: 'IconPark', titleEn: 'IconPark', source: 'IconPark(ByteDance)', license: 'Apache-2.0', note: '字节跳动 IconPark 整库搬入 —— 多彩填充风;品牌类(83 个)与带品牌名的图标不收', noteEn: "ByteDance IconPark imported whole — colourful filled style; the brand category and brand-named icons are left out", bulk: true },
  people: { title: '人与职业', titleEn: 'People', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '工作类型与人群 —— 只取中性、正面的表达', noteEn: 'Work types and groups of people — neutral, positive depictions only' },
  region: { title: '地区', titleEn: 'Regions', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '地理与行政层级 —— 国家 / 省 / 市 / 区县 / 可用区 / 机房', noteEn: 'Geography and administrative levels — country, province, city, district, availability zone, data centre' },
  filetype: { title: '文件类型', titleEn: 'File Types', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '常见的文件类型 —— 文档 / 表格 / 代码 / 图片 / 音视频 / 压缩包', noteEn: 'Common file types — documents, sheets, code, images, media, archives' },
  twemoji: { title: 'Emoji(Twemoji)', titleEn: 'Emoji (Twemoji)', source: 'Twemoji', license: 'MIT', note: 'Twitter 的 emoji 集,整库搬入;同一批概念在 fluent: / noto: 里另有两版', noteEn: "Twitter's emoji set, imported whole; the same concepts also come in fluent: and noto:" },
  fluent: { title: 'Emoji(Fluent)', titleEn: 'Emoji (Fluent)', source: 'Microsoft Fluent Emoji', license: 'MIT', note: '微软 Fluent Emoji 的扁平版,整库搬入;键名跟 twemoji: / noto: 对得上,同一概念三种画', noteEn: 'Microsoft Fluent Emoji (Flat), imported whole; keys match twemoji: and noto: — same concept, three drawings' },
  noto: { title: 'Emoji(Noto)', titleEn: 'Emoji (Noto)', source: 'Noto Emoji', license: 'OFL-1.1', note: 'Google Noto Emoji 2D,整库搬入;键名跟 twemoji: / fluent: 对得上,同一概念三种画', noteEn: 'Google Noto Emoji 2D, imported whole; keys match twemoji: and fluent: — same concept, three drawings' },
  aviation: { title: '航空', titleEn: 'Aviation', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '航空与航天 —— 客机 / 无人机 / 卫星 / 地面站 / 塔台 / 空域', noteEn: 'Aviation and spaceflight — airliners, drones, satellites, ground stations, towers, airspace' },
  education: { title: '教育', titleEn: 'Education', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '教育场景 —— 小学 / 初中 / 高中 / 大学 等学段,以及校园里的通用概念', noteEn: 'Education — school stages from primary to university, plus everyday campus concepts' },
  weather: { title: '天气', titleEn: 'Weather', source: 'x-cmd/icon 自绘', license: 'Apache-2.0', note: '天气现象与观测要素 —— 晴雨雪雾 / 温度 / 湿度 / 气压', noteEn: 'Weather phenomena and observations — sun, rain, snow, fog, temperature, humidity, pressure' },
};

// 整库搬入的分类:catalog.tsv 不强制一行一个(几千个图标不可能手写描述)
const BULK = new Set(Object.entries(CATS).filter(([, m]) => m.bulk).map(([c]) => c));
// 品牌图形:逐个要有许可记录或"待审"登记
const NEEDS_RECORD = new Set(['brand', 'bootstrap']);

// 名字像品牌的 —— 兜底:这类图标必须在 brands/trademarks.tsv 里登记
const BRANDISH =
  /^(alipay|amazon|android|anthropic|apple|behance|bing|bootstrap|chatgpt|discord|dribbble|dropbox|facebook|github|gitlab|google|grok|instagram|javascript|linkedin|markdown|meta|microsoft|openai|paypal|pinterest|reddit|sina-weibo|slack|snapchat|spotify|stack-overflow|stripe|telegram|tencent|tiktok|trello|twitter|typescript|unity|vimeo|wechat|whatsapp|wikipedia|windows|wordpress|youtube)/;

const MIME = { svg: 'image/svg+xml' }; // 只收 SVG —— 其它格式不接受

// 图标文件一律单行 —— sprite 一行一个 symbol,合并、grep、diff 都靠这个
// (页面上看源码时再展开成缩进的可读格式)
function checkOneLine(file) {
  const raw = readFileSync(file, 'utf8');
  if (raw.replace(/\n$/, '').includes('\n')) {
    console.error(`${file.replace(`${ROOT}/`, '')}: 图标文件必须单行(sprite 一行一个 symbol)—— 跑 npm run fmt`);
    process.exit(1);
  }
}

// SVG 的 viewBox —— 文件里没写就从根元素的 width/height 推一个。
// (Inkscape 导出的图标常常只有 width/height 没有 viewBox,没有的话在 sprite 里
//  会退回 0 0 24 24,内容被缩得看不见。)
function viewBoxOf(raw) {
  const vb = raw.match(/viewBox="([^"]+)"/)?.[1];
  if (vb) return vb;
  const open = raw.match(/<svg[^>]*>/)?.[0] || '';
  const w = open.match(/\bwidth="([\d.]+)/)?.[1];
  const h = open.match(/\bheight="([\d.]+)/)?.[1];
  return w && h ? `0 0 ${w} ${h}` : '0 0 24 24';
}

// 版本号比较:v2 比 v10 小
const verCmp = (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);

// sprite 里的 id:把 <cat>/v<n>:<concept> 压成合法片段
const spriteId = (id) => id.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

// 品牌图形的闸门:有记录按记录走(withheld 不发布),名字像品牌的必须登记
function brandGate(id, concept, records, trademarks) {
  const rec = records.get(id);
  const tm = trademarks.get(id);
  if (rec && rec.meta.verdict === 'withheld') {
    console.log(`跳过 ${id}(记录结论:withheld —— 不发布)`);
    return false;
  }
  if (rec && tm && tm.status !== 'reviewed') {
    console.error(`${id} 有许可记录,但 trademarks.tsv 里状态是 ${tm.status} —— 改成 reviewed`);
    process.exit(1);
  }
  if (!tm && BRANDISH.test(concept)) {
    console.error(`${id} 名字像品牌图标 —— 在 brands/trademarks.tsv 里登记(商标权人 + 状态)`);
    process.exit(1);
  }
  return true;
}

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

// ---- 读 versions.json:每个分类当前推荐哪个版本 ----
// 这是人的决定,不自动取最高版本 —— 新画一版进来,别名先不动;
// 等这版真更好了,再改这一行。别名跟着走,老图也还在。
const VERSIONS_FILE = join(ROOT, 'versions.json');
let versions = {};
if (existsSync(VERSIONS_FILE)) {
  versions = JSON.parse(readFileSync(VERSIONS_FILE, 'utf8'));
  for (const [cat, ver] of Object.entries(versions)) {
    if (!/^v\d+$/.test(ver)) {
      console.error(`versions.json: ${cat} 的版本 "${ver}" 格式不对(应为 v<n>,如 v0)`);
      process.exit(1);
    }
    if (!CATS[cat]) {
      console.error(`versions.json: ${cat} 是不存在的分类`);
      process.exit(1);
    }
  }
}

// ---- 读 catalog.tsv ----
// 格式:<id>\t<中文>\t<English> —— 中英文分开,页面上按语言取其一,不合在一起显示
const catalog = new Map(); // id → { zh, en }
const lines = readFileSync(CATALOG, 'utf8').split('\n');
lines.forEach((line, i) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const [id, zh, en, ...rest] = t.split('\t');
  if (!id || !zh || !en || rest.length) {
    console.error(`catalog.tsv:${i + 1} 格式不对(应为 <id>\\t<中文>\\t<English>): ${line}`);
    process.exit(1);
  }
  if (catalog.has(id)) {
    console.error(`catalog.tsv:${i + 1} id 重复: ${id}`);
    process.exit(1);
  }
  catalog.set(id, { zh: zh.trim(), en: en.trim() });
});

// ---- 扫 icons/ ----
// 分类有两种形态:平铺(icons/<cat>/<concept>.svg)或版本化(icons/<cat>/v<n>/<concept>.svg)。
// 版本化的分类,构建会额外生成别名条目 <cat>:<concept> —— 指向当前推荐的版本。
const found = new Map(); // 具体键 → { file, cat, version, concept }
const catVersions = new Map(); // cat → 版本列表(数字序)

for (const cat of readdirSync(ICONS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const catName = cat.name;
  if (!CATS[catName]) {
    console.error(`icons/${catName}/ 是不认识的分类 —— 先在 scripts/build.mjs 的 CATS 里登记`);
    process.exit(1);
  }
  const dir = join(ICONS_DIR, catName);
  const entries = readdirSync(dir);
  const vdirs = entries.filter((e) => /^v\d+$/.test(e)).sort(verCmp);
  const flat = entries.filter((e) => !/^v\d+$/.test(e)).sort();

  if (vdirs.length && flat.length) {
    console.error(`icons/${catName}/ 里版本目录与平铺文件混在一起 —— 一个分类要么全版本化,要么全平铺`);
    process.exit(1);
  }

  if (vdirs.length) {
    catVersions.set(catName, vdirs);
    for (const vd of vdirs) {
      for (const f of readdirSync(join(dir, vd)).sort()) {
        const ext = f.split('.').pop();
        if (!MIME[ext]) {
          console.error(`icons/${catName}/${vd}/${f}: 只接受 SVG(.${ext} 不要)`);
          process.exit(1);
        }
        const concept = f.slice(0, -(ext.length + 1));
        checkOneLine(join(dir, vd, f));
        const id = `${catName}/${vd}:${concept}`;
        if (found.has(id)) {
          console.error(`id 重复: ${id}`);
          process.exit(1);
        }
        if (NEEDS_RECORD.has(catName) && !brandGate(id, concept, records, trademarks)) continue;
        found.set(id, { file: `icons/${catName}/${vd}/${f}`, cat: catName, version: vd, concept });
      }
    }
  } else {
    for (const f of flat) {
      const ext = f.split('.').pop();
      if (!MIME[ext]) {
        console.error(`icons/${catName}/${f}: 只接受 SVG(.${ext} 不要)`);
        process.exit(1);
      }
      const concept = f.slice(0, -(ext.length + 1));
      checkOneLine(join(dir, f));
      const id = `${catName}:${concept}`;
      if (found.has(id)) {
        console.error(`id 重复: ${id}`);
        process.exit(1);
      }
      if (NEEDS_RECORD.has(catName) && !brandGate(id, concept, records, trademarks)) continue;
      found.set(id, { file: `icons/${catName}/${f}`, cat: catName, version: null, concept });
    }
  }
}

// ---- 别名:版本化分类里,概念键 <cat>:<concept> 指向当前推荐的版本 ----
// 推荐版本在 versions.json 里定 —— 是人的决定,新画一版进来别名先不动。
// 推荐版本里没有的概念,退到拥有它的最高版本。
const alias = new Map(); // 别名键 → 具体键
for (const [catName, vers] of catVersions) {
  const rec = versions[catName];
  if (!rec) {
    console.error(`icons/${catName}/ 是版本化分类,versions.json 里没有登记 —— 补一行 "${catName}": "v0"`);
    process.exit(1);
  }
  if (!vers.includes(rec)) {
    console.error(`versions.json: ${catName} 推荐 ${rec},但 icons/${catName}/${rec}/ 不存在`);
    process.exit(1);
  }
  for (const [id, info] of found) {
    if (info.cat !== catName) continue;
    let target = rec;
    if (!found.has(`${catName}/${target}:${info.concept}`)) {
      target = [...vers].sort((a, b) => verCmp(b, a)).find((v) => found.has(`${catName}/${v}:${info.concept}`));
      if (target == null) continue;
    }
    alias.set(`${catName}:${info.concept}`, `${catName}/${target}:${info.concept}`);
  }
}

// ---- 校验 ----
let bad = 0;
for (const [id, info] of found) {
  if (catalog.has(id)) continue;
  if (BULK.has(info.cat)) continue; // 整库搬入的:描述自动生成
  console.error(`catalog.tsv 缺一行: ${id}\t(自己补一行描述)`);
  bad++;
}
for (const id of catalog.keys()) {
  if (alias.has(id)) {
    console.error(`catalog.tsv 里的 ${id} 是别名 —— 别名由构建生成,只写具体版本的键 ${alias.get(id)}`);
    bad++;
    continue;
  }
  if (!found.has(id)) {
    console.error(`catalog.tsv 里的 ${id} 没有对应文件`);
    bad++;
  }
}
for (const cat of Object.keys(versions)) {
  if (catVersions.has(cat)) continue;
  console.error(`versions.json 里登记了 ${cat},但 icons/${cat}/ 下没有版本目录`);
  bad++;
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
const zhNames = {}; // id → 中文名(翻译包用)
const metaFile = new Map(); // id → 图标原文件(清单里不带,构建自己要用)
const extOf = (id) => metaFile.get(id).split('.').pop();
const metaById = new Map();
for (const [id, info] of [...found].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const ext = info.file.split('.').pop();
  const rec = records.get(id);
  const tm = trademarks.get(id);
  const raw = readFileSync(join(ROOT, info.file), 'utf8');
  // 图标自己声明的类型与内容区:
  //   type  = normal(正常) / base(底座) / frame(框型)
  //   inner = "x y w h" —— 那个长方区间,后面按需合成图就往这儿放
  const rootTag = raw.match(/<svg[^>]*>/)?.[0] || '';
  const type = rootTag.match(/data-type="([^"]+)"/)?.[1] || 'normal';
  const innerRaw = rootTag.match(/data-inner="([^"]+)"/)?.[1];
  const inner = innerRaw
    ? (([x, y, w, h]) => ({ x, y, w, h }))(innerRaw.split(/\s+/).map(Number))
    : undefined;
  const c = catalog.get(id);
  // 整库搬入的分类没有手写描述 —— 用概念名兜底
  const autoEn = info.concept.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  const m = {
    id,
    cat: info.cat,
    concept: info.concept,
    version: info.version || undefined, // 版本化分类才有
    descEn: c ? c.en : autoEn,
    viewBox: ext === 'svg' ? viewBoxOf(raw) : undefined,
    type,
    ...(inner ? { inner } : {}),
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
  };
  metas.push(m);
  metaById.set(id, m);
  metaFile.set(id, info.file);
  zhNames[id] = c ? c.zh : info.concept; // 中文名另存翻译包
}

// 别名:概念键指向推荐版本 —— **不单开一条清单项**
// (同一个图标两个键而已;单开一条的话,搜索结果里同一个图会出现两次)
for (const [aid, cid] of [...alias].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const c = metaById.get(cid);
  c.aliasFor = aid; // 用户平时写的那个键
  c.recommended = true; // 这是该概念推荐的那一版
}

const cats = Object.entries(CATS).map(([cat, meta]) => ({
  cat,
  title: meta.title,
  titleEn: meta.titleEn,
  source: meta.source,
  license: meta.license,
  note: meta.note,
  noteEn: meta.noteEn,
  count: new Set([...found.values()].filter((i) => i.cat === cat).map((i) => i.concept)).size,
  versioned: catVersions.has(cat),
  versions: catVersions.get(cat) || [],
  recommended: versions[cat] || '',
}));

const BUILD = createHash('sha1')
  .update(metas.map((m) => `${m.id}:${statSync(metaFile.get(m.id)).size}`).join('\n'))
  .digest('hex')
  .slice(0, 10);

const manifest = { build: BUILD, cats, icons: metas };

// ---- src/gen.ts:Worker 用的精简数据(不嵌字节,图标走静态资源) ----
const id2file = {};
for (const m of metas) {
  const p = `i/${m.id.replace(':', '/')}.${extOf(m.id)}`;
  id2file[m.id] = p;
  if (m.aliasFor) id2file[m.aliasFor] = p; // 别名键也是这个图标
}
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
  /** 具体版本(v0 / v1)—— 版本化分类才有 */
  version?: string;
  /** 别名条目:概念键指向推荐版本 */
  recommended?: boolean;
  /** 别名指向的具体键 */
  aliasOf?: string;
  /** 指向本条的具体键的别名(只有推荐版本有) */
  aliasFor?: string;
  /** 中文说明 */
  desc: string;
  /** 英文说明 */
  descEn: string;
  /** sprite 里的符号 id(PNG 没有) */
  spriteId?: string;
  /** 图标的 viewBox(PNG 没有) */
  viewBox?: string;
  file: string;
  path: string;
  mime: string;
  bytes: number;
  source: string;
  license: string;
  note: string;
  /** 单色图形(深色主题下垫白底) */
  mono?: boolean;
  /** normal(正常) / base(底座) / frame(框型) */
  type: 'normal' | 'base' | 'frame';
  /** 框型/底座的内容区(长方区间)—— 按需合成图往这儿放 */
  inner?: { x: number; y: number; w: number; h: number };
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
  /** 中文名 */
  title: string;
  /** 英文名 */
  titleEn: string;
  source: string;
  license: string;
  /** 中文说明 */
  note: string;
  /** 英文说明 */
  noteEn: string;
  count: number;
  /** 有版本目录 */
  versioned: boolean;
  /** 版本列表(数字序) */
  versions: string[];
  /** 当前推荐的版本 */
  recommended: string;
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
  const dest = join(PUBLIC, `i/${m.id.replace(':', '/')}.${extOf(m.id)}`);
  mkdirSync(join(dest, '..'), { recursive: true });
  copyFileSync(join(ROOT, metaFile.get(m.id)), dest);
}

// ---- sprite:矢量图标合成一张,页面用 <use> 引用 ----
// 一个分类页要显示两千多个图标,逐个请求太碎;合成一张,一次拿完。
// PNG(云厂商那批)进不了 sprite,还是单独文件。
function spriteOf(list) {
  const symbols = new Map(); // spriteId → { viewBox, body, ns }
  for (const m of list) {
    const sid = spriteId(m.id); // sprite 里的符号 id(清单里不带,这里算)
    if (symbols.has(sid)) continue;
    const raw = readFileSync(join(ROOT, metaFile.get(m.id)), 'utf8');
    const open = raw.match(/<svg[^>]*>/)?.[0] || '<svg>';
    const inner = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1]?.trim();
    if (!inner) continue;
    // 根元素上的命名空间声明要搬到 symbol 上 —— 少了 xmlns:xlink 之类的前缀没人声明,
    // 整个 sprite 的 XML 会在这里断掉,后面的图标全都不渲染。
    const ns = [...open.matchAll(/xmlns(?::[\w-]+)?="[^"]*"/g)].map((x) => x[0]).join(' ');
    symbols.set(sid, { viewBox: m.viewBox, body: inner, ns });
  }
  const sprite = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none">'];
  for (const [id, s] of symbols) {
    sprite.push(`<symbol id="${id}" viewBox="${s.viewBox}" ${s.ns}>${s.body}</symbol>`);
  }
  sprite.push('</svg>');
  const text = sprite.join('\n');

  // 守门:XML 一旦在中间断了,浏览器会从断点往后全不渲染 —— 构建时就得发现
  for (const [id, s] of symbols) {
    const used = new Set([...s.body.matchAll(/<([a-zA-Z][\w-]*):/g)].map((x) => x[1]));
    const declared = new Set([...s.ns.matchAll(/xmlns:([\w-]+)=/g)].map((x) => x[1]));
    for (const u of used) {
      if (!declared.has(u)) {
        console.error(`sprite: ${id} 用了没声明的命名空间前缀 ${u}: —— 补上它的 xmlns 声明`);
        process.exit(1);
      }
    }
  }
  return { text, count: symbols.size };
}

// ---- 分包:star(精选)+ 每个分类一包 ----
// 一整张 sprite 是 5 MB 多,页面为显示几十个图标要把它整个拉下来。
// 拆开:star 是首页先要的那一小撮(star.tsv 里挑的),其余按分类各打包,
// 客户端按需拉 —— bootstrap / iconpark 这种整库搬进来的大包也各是各的。
const STAR_FILE = join(ROOT, 'star.tsv');
const starIds = new Set(); // 别名形式的 id:<cat>:<concept>
if (existsSync(STAR_FILE)) {
  for (const line of readFileSync(STAR_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [cat, list] = t.split('\t');
    if (!cat || !list) continue;
    if (BULK.has(cat)) {
      console.error(`star.tsv: ${cat} 是整库搬进来的分类 —— 不进 star`);
      process.exit(1);
    }
    for (const c of list.split(',').map((x) => x.trim()).filter(Boolean)) starIds.add(`${cat}:${c}`);
  }
}
// 别名 → 具体版本;找不到就是没这个概念
const starMetas = [];
for (const id of starIds) {
  // 平铺分类(brand 那些)没有别名条目,id 本身就是键
  const concrete = alias.get(id) || (metaById.has(id) ? id : null);
  if (!concrete || !metaById.has(concrete)) {
    console.error(`star.tsv: ${id} 没有对应的图标`);
    process.exit(1);
  }
  starMetas.push(metaById.get(concrete));
}
const starAll = new Set(starMetas.map((m) => m.id));
const starList = metas.filter((m) => starAll.has(m.id));
for (const m of starList) {
  m.bundle = 'star';
  m.shard = 'sprite.star.svg'; // star 自己一片
}

const catMetas = new Map(); // cat → metas
for (const m of metas) {
  if (m.bundle) continue; // star 里的图标归 star 包
  if (!catMetas.has(m.cat)) catMetas.set(m.cat, []);
  catMetas.get(m.cat).push(m);
}
for (const [cat, list] of catMetas) for (const m of list) m.bundle = cat;


const bundles = {
  star: { icons: starList.length, sprite: 'sprite.star.svg', manifest: 'manifest.star.json' },
};
const starSprite = spriteOf(starList);
writeFileSync(join(PUBLIC, 'sprite.star.svg'), starSprite.text);
writeFileSync(
  join(PUBLIC, 'manifest.star.json'),
  JSON.stringify({ build: BUILD, cats, icons: starList }),
);
console.log(`public/icon/sprite.star.svg: ${starSprite.count} 个符号(star)`);

// 分片:按清单里的 id 顺序切,一片一个 sprite 文件,页面按需取片 ——
// 十万个图标也只下看得见的那几片,不用整包拉
//
// 片的大小按**压后**算:一片压完不超过 1 MB(边缘会自动 brotli)。
// 先按原始体积粗切,再压一压看超没超,超了就对半切 —— 直到每片都在限额内。
const SHARD_MAX = 300; // 一片最多多少个符号
const SHARD_BYTES = 900 * 1024; // 一片压后的上限(留一点余量给 1 MB)
const brSize = (chunk) =>
  brotliCompressSync(Buffer.from(spriteOf(chunk).text), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
function fitChunks(list) {
  const out = [];
  let cur = [];
  let raw = 0;
  for (const m of list) {
    cur.push(m);
    raw += statSync(metaFile.get(m.id)).size;
    if (raw >= 1.5 * 1024 * 1024) {
      out.push(cur);
      cur = [];
      raw = 0;
    }
  }
  if (cur.length) out.push(cur);
  // 压完还超限的,对半再切
  const fit = [];
  for (const c of out) {
    if (c.length <= 1 || brSize(c) <= SHARD_BYTES) {
      fit.push(c);
      continue;
    }
    const half = Math.ceil(c.length / 2);
    fit.push(...fitChunks(c.slice(0, half)), ...fitChunks(c.slice(half)));
  }
  return fit;
}
for (const [cat, list] of catMetas) {
  const shards = [];
  for (const chunk of fitChunks(list)) {
    const file = `sprite.${cat}.${shards.length}.svg`;
    writeFileSync(join(PUBLIC, file), spriteOf(chunk).text);
    for (const m of chunk) m.shard = file;
    shards.push({ file, icons: chunk.length });
  }
  writeFileSync(
    join(PUBLIC, `manifest.${cat}.json`),
    JSON.stringify({ build: BUILD, cats: cats.filter((c) => c.cat === cat), icons: list }),
  );
  bundles[cat] = {
    icons: list.length,
    manifest: `manifest.${cat}.json`,
    shards: shards.map((x) => x.file),
  };
}

// 全量 manifest(客户端搜索时下的那份"全名单")—— 要在分片之后写:
// 分片会给每个图标标上它住在哪一片
writeFileSync(join(PUBLIC, 'manifest.json'), JSON.stringify(manifest));

// 翻译包:中文名单独一份,英文区不用下 —— 切到中文时才拉
writeFileSync(join(PUBLIC, 'manifest.zh.json'), JSON.stringify(zhNames));

// 索引:分类清单 + 每包多大 —— 客户端第一个请求就是它
// total   —— 全部条目(含各版本的旧版)
// browsable —— 首页默认能看到的那批(只摆推荐版本)
const browsable = metas.filter((m) => !m.version || m.recommended).length;
writeFileSync(
  join(PUBLIC, 'index.json'),
  JSON.stringify({ build: BUILD, cats, bundles, total: metas.length, browsable }),
);

// 不再生成整张 sprite —— 片就是它的替代品:
// 十万个图标合成一张是几十 MB,没人下得起;片按需取,每片 ≤300 个。
// 缓存策略:图标文件长缓存(URL 上带构建号,重新部署即失效),清单短缓存
writeFileSync(
  join(ROOT, 'public/_headers'),
  `/icon/i/*\n  Cache-Control: public, max-age=3600\n\n/icon/sprite*.svg\n  Cache-Control: public, max-age=3600\n\n/icon/manifest*.json\n  Cache-Control: public, max-age=0, must-revalidate\n\n/icon/index.json\n  Cache-Control: public, max-age=0, must-revalidate\n`,
);
console.log(`public/icon/: ${metas.length} 个文件 + ${Object.keys(bundles).length} 个包`);

// ---- dist/:本地预览用的静态站 ----
const DIST = join(ROOT, 'dist');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'i'), { recursive: true });
writeFileSync(join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
for (const m of metas) {
  const dest = join(DIST, `i/${m.id.replace(':', '/')}.${extOf(m.id)}`);
  mkdirSync(join(dest, '..'), { recursive: true });
  copyFileSync(join(ROOT, metaFile.get(m.id)), dest);
}
for (const f of readdirSync(PUBLIC)) {
  if (f.endsWith('.svg') || f.endsWith('.json')) copyFileSync(join(PUBLIC, f), join(DIST, f));
}
for (const f of ['style.css', 'app.js']) copyFileSync(join(ROOT, 'site', f), join(DIST, f));
writeFileSync(
  join(DIST, 'index.html'),
  readFileSync(join(ROOT, 'site', 'index.html'), 'utf8')
    .replace('__ICON_BASE__/', '/')
    .replace('BUILD_SLOT', BUILD),
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
