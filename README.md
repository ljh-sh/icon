# x-cmd/icon

给 [x-cmd/draw](https://github.com/x-cmd/draw) 画架构图用的图标库。

两类东西放在一起:

- **云厂商官方标识** —— AWS / Azure / GCP,直接取**厂商自己的官方图标包**里的 SVG
  (矢量,原样不改):[AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)、
  [Microsoft Azure Public Service Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)、
  [Google Cloud 产品图标](https://cloud.google.com/icons)。条款与处理见 `NOTICE.md`。
- **本仓自绘的通用概念** —— 服务器、磁盘阵列、路由器、显示器、桌面应用这类没有厂商归属的东西,
  24×24 网格、彩色填充的 SVG。

查询页:**https://x-cmd.com/iconbase/**(另一处:https://po6.sh/icon)

## 键名规范

```
<cat>:<concept>            概念键 —— 别名,指向该分类当前推荐的版本
<cat>/v<n>:<concept>      具体版本 —— 钉死某一版
```

`cat` 是分类,`concept` 是分类内的概念名。分类按**素材从哪来、许可怎么算**分:

| cat | 来源 | 含义 | 许可怎么算 |
| --- | --- | --- | --- |
| `aws` `azure` `gcp` `aliyun` `oci` `ibm` | 厂商官方图标包 | 云服务 | 原厂 SVG 原样;商标归各自权利人,见 `NOTICE.md` |
| `infra` | 本仓自绘 | 通用基础设施概念 | 本仓 Apache-2.0 |
| `org` | 本仓自绘 | 公司与机构的**抽象符号** | 本仓 Apache-2.0,不含任何商标图形 |
| `brand` | 官方渠道 / Simple Icons(CC0) / Wikimedia Commons | 常用品牌图形 | **逐个按该品牌的条款分析**,记在 `brands/` 里 |
| `bootstrap` | Bootstrap Icons(整库) | 第三方图标库的全部图标 | 著作权 MIT;画了品牌的那五十来个另有登记 |
| `iconpark` | IconPark(字节跳动,整库) | 多彩填充风的通用概念 | 著作权 Apache-2.0;品牌类不收 |
| `db` | 本仓自绘 | 数据库的概念与形态 | 本仓 Apache-2.0 |
| `ai` | 本仓自绘 | AI 架构里的通用概念 | 本仓 Apache-2.0 |
| `k8s` | 本仓自绘 | K8s 组件概念(非官方标识) | 本仓 Apache-2.0 |
| `sec` | 本仓自绘 | 安全概念 | 本仓 Apache-2.0 |
| `obs` | 本仓自绘 | 指标 / 日志 / 链路 | 本仓 Apache-2.0 |
| `cat` `dog` `animal` | 本仓自绘 | 动物 | 本仓 Apache-2.0 |
| `chem` `circuit` `music` `food` | 本仓自绘 | 化学 / 电路 / 音乐 / 食物 | 本仓 Apache-2.0 |
| `military` | 本仓自绘 | 海军 / 空军 / 陆军的通用装备符号(不指向任何国家的具体部队) | 本仓 Apache-2.0 |
| `phy` `mech` | 本仓自绘 | 物理(原子/分子/力学/电磁/光学)、机械(齿轮/轴承/阀门/泵) | 本仓 Apache-2.0 |
| `travel` `nutrition` `transport` `weather` `education` | 本仓自绘 | 旅行 / 营养 / 交通工具 / 天气 / 教育 —— 日常生活与专题用得上的概念 | 本仓 Apache-2.0 |
| `people` `region` `filetype` `aviation` | 本仓自绘 | 人与职业(中性表达)/ 地区 / 文件类型 / 航空与航天 | 本仓 Apache-2.0 |
| `twemoji` `fluent` `noto` | emoji 官方集(整库) | emoji —— 同一批概念三种画法(Twemoji / 微软 Fluent / Google Noto) | MIT / MIT / OFL-1.1;不进 sprite,按片发 |
| `dev` | 本仓自绘 | 开发项目流程 —— 通用阶段 / 软件 / 硬件 | 本仓 Apache-2.0 |
| `common` | 本仓自绘 | 全库共用的基本符号 —— 锁 / 时钟 / 对勾 / 同步 | 本仓 Apache-2.0 |

例:`aws:ec2`、`infra:disk-array`、`db:locked`、`org:openai`、`brand:kubernetes`、`bootstrap:alipay`。

> `org:` 那一族是**自绘的抽象符号**,不含任何公司的商标图形 —— 公开分发不能带别人的 mark。
> 想要真正的 logo,走 `brand:`(官方优先,拿不到用 CC0 图标库)或 `bootstrap:`(第三方库),两者都要有许可记录。

## 版本化:自绘那批会迭代

自绘的分类(除 `aws` `azure` `gcp` `brand` `bootstrap` 外的全部)画风还会变。
一个概念可以有多个版本,**别名**指向当前推荐的那一版:

| | 键名 | 指向 |
| --- | --- | --- |
| 具体版本 | `infra/v0:gui` | 就是它自己 |
| **别名** | `infra:gui` | 该分类**当前推荐的版本** |

写 `infra:gui`,拿到的永远是"我们推荐的、最好看的那版";想钉死某一版就写全 `infra/v0:gui`。

- 目录:`icons/infra/v0/gui.svg`、`icons/infra/v1/gui.svg`
- 哪个版本算"推荐",写在仓库根 `versions.json`:

  ```json
  { "infra": "v0", "org": "v0" }
  ```

  这是**人的决定**,不自动取最高版本 —— 新画一版进来,别名先不动;
  等这版真更好了,再改这一行。别名跟着走,老图也还在。

- 外部那批平铺分类(aws / azure / gcp / aliyun / oci / ibm / brand / bootstrap / iconpark)不带版本 ——
  `aws:ec2` 既是具体键也是别名。
- `catalog.tsv` 只写**具体版本**的键;别名由构建生成,写进去构建直接报错。
- 查询页就一个过滤页:大搜索框 + 分类 chip,一边打一边筛。**没有分类子页** ——
  分类只是筛选条件,条件进 URL(`?cat=db&q=lock`),链接能分享。
- 点图标开右侧面板:图标信息(分类 / 版本 / 许可结论 / 商标 / 出处 / SVG 源码)
  + 一组相关图标(同分类的邻居、同名概念、描述相近的)。
  具体版本的格子带版本角标,面板里标出"别名 → infra/v0:gui"。
- 空查询时只摆推荐版本(别名条目);打了字才把全库各版本都放出来。

## 分片:star 先行,其余按片下

整库一万五千个图标,合成一张 sprite 是几十 MB —— 页面为了显示几十个图标
得把它整个拉下来,首屏白等几秒。所以**按片发**:

| 东西 | 内容 | 什么时候拉 |
| --- | --- | --- |
| `index.json` | 索引:分类清单 + 每片多大 | 第一个请求 |
| `sprite.star.svg` | **精选那一片** —— 每类挑 2 个(`star.tsv` 里挑),≤300 个符号 | 首页,只它 |
| `manifest.star.json` | 精选的清单 | 首页 |
| `manifest.json` | **全名单** —— 英文(原版)+ 结构信息,搜索时过滤用 | 用户一搜索 |
| `manifest.zh.json` | **中文翻译包** —— 只有中文名 | 切到中文时(英文区不用下) |
| `manifest.<cat>.json` | 各分类的清单 | 点那个分类的 chip |
| `sprite.<cat>.<k>.svg` | **片** —— 一个 sprite 文件,≤300 个符号 | 结果里用到哪片就下哪片 |

页面默认只下 star 那一小包(压后 29 KB),**默认只摆 60 个**。
往下走就按片取:每片 ≤300 个符号,下过的片存在 `localStorage` 里,
下次直接用(上限 4 MB,满了按最老的淘汰)。

搜索时先把全名单下下来本地过滤;点分类 chip 就只下那个分类的清单。
**片是按需的,不是整包** —— 十万个图标走的是同一套代码。

清单里只放**英文(原版)+ 结构信息**;中文名单独一份在 `manifest.zh.json`,
切到中文时才下(英文区根本不碰它)。能从 id 或分类推出来的字段
(路径、sprite 符号 id、出处、许可、单色标记)一律不带 —— 清单是搜索时一次性
下下来的,每一字节都要省:

| | 原始 | 压后 |
| --- | --- | --- |
| `index.json` | 19 KB | 4 KB |
| `manifest.star.json` | 34 KB | 6 KB |
| `sprite.star.svg` | 82 KB | 17 KB |
| **首页合计** | 135 KB | **27 KB** |
| `manifest.json`(全名单) | 3.1 MB | 160 KB |
| `manifest.zh.json`(中文包) | 766 KB | 86 KB |

想改精选:`star.tsv` 一行一个分类,后面跟概念名(逗号分隔)。
`bootstrap` / `iconpark` 不许进 star(构建时会拦)。

画一版新的:复制一份到 `icons/<cat>/v1/`,在 `catalog.tsv` 补上 `<cat>/v1:<concept>` 的行,
再把 `versions.json` 里那个分类改成 `"v1"` —— 别名就跟着走了,`v0` 还在。


## 资产统计

发出去的东西 —— 一共多少文件、多大、什么时候会被下。
数字是当前这版构建(15,187 个图标 / 48 个分类)实测的,重跑 `node scripts/stats.mjs` 更新。

### 按资产类型

| 资产 | 是什么 | 文件数 | 原始 | 压后(brotli) | 什么时候下 |
| --- | --- | ---: | ---: | ---: | --- |
| `index.json` | 索引:分类清单 + 每片多大 | 1 | 19 KB | **4 KB** | 第一个请求 |
| `manifest.star.json` | 精选那部分的清单 | 1 | 34 KB | **6 KB** | 首页 |
| `sprite.star.svg` | 精选那一片的符号 | 1 | 82 KB | **17 KB** | 首页 |
| `manifest.json` | 全名单(英文原版 + 结构信息) | 1 | 3.0 MB | **160 KB** | 用户一搜索 |
| `manifest.zh.json` | 中文翻译包 | 1 | 766 KB | **86 KB** | 切到中文 |
| `manifest.<cat>.json` | 各分类的清单 | 47 | 3.0 MB | 183 KB | 点那个分类 |
| `sprite.<cat>.<k>.svg` | **片** —— ≤300 个符号,压后 ≤1 MB | 76 | 50.1 MB | 5.6 MB | 结果用到哪片 |
| `i/<cat>/**/*.svg` | 图标原文件 | 15,187 | 50.0 MB | 15.8 MB | 下载单个 / 看源码 |
| **合计** | | **15,315** | **107 MB** | **22 MB** | |

### 一次访问实际下载多少

下过的资产全部留在 `localStorage`(按「构建号 + 文件名」),下次直接用 ——
发新版构建号就变了,旧的那批自动作废清掉。

| 场景 | 下什么 | 压后 | 实测(线上) |
| --- | --- | ---: | --- |
| 第一次来 | index + star 清单 + star 片 + 中文包 | 27 KB | 0.92 s / 5 个请求 |
| **刷新** | **什么都不下**(只剩页面本身) | 0 | **0.29 s / 1 个请求** |
| 点一个分类 | 那个分类的清单 + 它的那一片 | +约 4 KB + ≤438 KB | 0.11 s / 首次 1 个请求,之后 0 |
| 搜索 | 全名单 + 用到的那几片 | +160 KB | — |
| 切到中文 | 中文翻译包 | +86 KB | — |
| 下载单个图标 | 那一个文件 | 约 1 KB | — |

**用户第一次来只用 27 KB;刷新和点击一个请求都不发。**

### 各分类的规模

| 分类 | 图标 | 原始 | 压后 | 片数 |
| --- | ---: | ---: | ---: | ---: |
| `noto` | 3750 | 32.0 MB | 8.8 MB | 22 |
| `twemoji` | 4009 | 9.7 MB | 3.8 MB | 7 |
| `fluent` | 1231 | 2.8 MB | 1.0 MB | 2 |
| `iconpark` | 2555 | 1.9 MB | 686 KB | 2 |
| `bootstrap` | 2078 | 1.2 MB | 608 KB | 1 |
| `oci` | 232 | 637 KB | 245 KB | 1 |
| `aliyun` | 306 | 543 KB | 208 KB | 1 |
| `aws` | 154 | 514 KB | 183 KB | 1 |
| `ibm` | 122 | 260 KB | 91 KB | 1 |
| `azure` | 51 | 103 KB | 37 KB | 1 |
| `k8s` | 8 | 67 KB | 29 KB | 1 |
| `programming` | 38 | 48 KB | 22 KB | 1 |
| `gcp` | 41 | 43 KB | 15 KB | 1 |
| `chem` | 55 | 25 KB | 13 KB | 1 |
| `dev` | 49 | 19 KB | 10 KB | 1 |
| `brand` | 10 | 22 KB | 10 KB | 1 |
| 其余 32 个分类 | 498 | — | — | 31 |

三个 emoji 分类占了将近六成 —— Noto 一个就 32 MB 原始 / 8.8 MB 压后
(它的渐变多,单个图形最重)。`iconpark` / `bootstrap` 是整库搬进来的两个大包,
各自分片、按需取。

## 目录

```
icons/<cat>/<concept>.<ext>     图标原文件(svg 或 png)—— 平铺分类
icons/<cat>/v<n>/<concept>.<ext> 图标原文件 —— 版本化分类(自绘那批)
symbols/                         基本符号 —— 会意组合的唯一出处
symbols/recipes.tsv              配方表:哪个概念 = 哪些符号叠起来
catalog.tsv                      索引:<id>\t<中文>\t<English>,一行一个(只写具体版本)
versions.json                    每个分类当前推荐哪个版本
star.tsv                         精选:每类挑 2 个 —— 首页先加载这一小包
brands/<cat>-<concept>.md        品牌图形的许可记录(brand / bootstrap 必须有)
scripts/compose.mjs              按配方组装图标
scripts/build.mjs                校验 + 生成(src/gen.ts、src/page.ts、dist/)
scripts/serve.mjs                本地静态预览
scripts/stats.mjs               资产统计 —— 各类型文件多大、什么时候会被下
site/                            查询页(index.html / style.css / app.js)
src/index.ts                     Worker:把库挂在 po6.sh/icon 上
src/gen.ts                       生成物:图标字节 + 元数据
src/page.ts                      生成物:CSS/JS 内联后的页面
```

## 基本符号:会意组合,不是象形图

自绘的图标不该一个概念画一张插画 —— 那样没有共同的视觉词汇,改一次画风要翻
几百个文件。做法是先定**基本符号**,概念由符号**会意**出来(像会意字)。

**构图规范 v3:一个图标 = 对象(大,居中偏左)+ 修饰(大,右上角,叠在对象上)。**

```
db:locked     =  数据库圆柱(对象) + 挂锁(修饰,右上)
db:index      =  表(对象) + 索引条(修饰,右上)
db:kv         =  键值条目(对象) + 闪电(修饰,右上)
```

- **对象** = 这个概念作用在什么上 —— 不是"分类"。`db:locked` 的对象是数据库圆柱,
  `db:index` 的对象是表,`db:kv` 的对象是键值条目
- **修饰** = 状态或动作 —— 锁 / 时钟 / 对勾 / 同步 / 切换 / 箭头,全库共用一套,
  同一个符号只画一次
- **分类**(`db:` / `sec:` / `k8s:`)只活在键名里,不画进图形
- **右下角空着** —— 将来放"×2"这种程序化生成的计数徽标

修饰符**不是徽章**:它跟对象一样大,叠在对象上,不是一个压在角上的小标记。

### 包围结构 —— 跟汉字的间架结构一样

除了左右结构(对象 + 修饰),还有**框在外、内容在里面**:

```
frame/full/<n>     全包围:框满画布,内容居中(白板上画一个原子)
frame/bottom/<n>   下包围:框在下(地图 / 国家 / 湖),内容在上
in/<n>             框里的内容 —— 位置由框的 kind 决定
```

框的中间留得大,是留给里面的东西的 —— 跟汉字里"囗"必须比里面的"玉"大一圈一个道理。
左边包围 / 右边包围还没做,见 issue #8。

### manifest 里的 type 与 inner

清单里每个图标带两个字段,给"按需合成"用:

```json
{ "id": "frame/v0:display", "type": "frame", "inner": { "x": 5, "y": 6.4, "w": 14, "h": 7.2 } }
```

| type | 意思 | inner |
| --- | --- | --- |
| `normal` | 正常 —— 画完了,没有可再合成的地方 | 没有 |
| `base` | 底座 —— 上面放东西(台面、底座) | 台面之上那块长方区间 |
| `frame` | 框型 —— 里面放东西(屏、白板、云…) | 框里那块长方区间 |

`inner` 是**图标的 24×24 坐标系**里的长方区间(x / y / w / h),往这儿叠一个符号就行。
框里已经放了东西的(比如"白板上的原子"),类型就是 `normal` —— 那时候它不再是框了。

声明写在符号文件的根元素上(`data-type` / `data-inner`),compose 带着走,构建时进清单。

```
symbols/
  palette.json        色板 —— 角色的唯一出处(surface / neutral / primary /
                      accent / success / danger / violet / on-color)
  obj/*.svg           对象 —— 每个概念挑一个(圆柱 / 表 / 键值条目 / 产品盘 / 工作负载…)
  mod/*.svg           修饰 —— 全库共用的状态符号(lock / clock / check / sync…),
                      以及各家的商标(github 的猫 / k8s 的轮子 / sec 的盾)
  frame/full/*.svg    全包围的框 —— 满画布,中间空着(屏 / 白板 / 门 / 云 / 太阳…)
  frame/bottom/*.svg  下包围的框 —— 地图 / 国家 / 湖
  in/*.svg            框里的内容(原子 / 齿轮 / 图表 / 灯泡 / 代码)
  recipes.tsv         配方表:哪个概念 = 哪些符号叠起来
```

- 符号画在自己的规范框里(对象 14×14、修饰 12×12),`scripts/compose.mjs` 按槽位
  摆好再拼成 24×24 的 SVG,写进 `icons/<cat>/v<n>/`。
  `npm run build` 先跑它 —— 改一个符号,全库跟着变,不会走样。
- 符号里颜色写 `@role.key`,compose 时按 `palette.json` 换成实际颜色;
  用了色板里没有的颜色,构建直接报错。
- 产品的"大标记"是品牌色圆盘 + 白色自绘字形 —— 图形是自绘的抽象符号,
  不是官方标识,配色取接近该品牌的颜色。
- `common:` 分类放共用符号本身(`common:lock` / `clock` / `check` / `sync`)——
  要一把锁,直接用锁的图标,不用绕到 `db:` 里。

> 键名读作"对象处于该状态" —— `db:lock`(一把锁这个名词)与 `db:locked`
> (锁定状态的数据库)是两个概念,前者没进库,锁本身用 `common:lock`。

## 品牌图形:逐个按许可分析

`brand:` 和 `bootstrap:` 里的图标是**别人的商标**。著作权那层(MIT / Apache-2.0)好办,
商标那层才是雷区 —— 所以每个品牌都要有一份记录,记在 `brands/<cat>-<concept>.md`:

```markdown
---
id: bootstrap:alipay
title: 支付宝 / Alipay
verdict: caution
source: Bootstrap Icons 1.13.1 · https://…
license: MIT(图标素材的著作权)
licenseUrl: https://github.com/twbs/icons/blob/main/LICENSE
trademarkOwner: 蚂蚁集团(Ant Group Co., Ltd. 及其关联公司)
trademarkPolicy: https://docs.alipayplus.com/…
restrictions: 不得暗示蚂蚁背书或合作;不得当作自己的标识;仅用于指代该品牌
reviewed: 2026-11-17
---

(下面是分析正文:查了哪个官方页面、条款怎么写、我们怎么用、什么情况下要下架)
```

`verdict` 三档:

| verdict | 意思 | 构建行为 |
| --- | --- | --- |
| `ok` | 政策明确、我们的用法在许可范围内 | 收录 |
| `caution` | 收录,但只能指示性引用,页面上带「谨慎」标记 | 收录 |
| `withheld` | 分析留档,**不发布** | 图标不进清单,记录留着 |

构建时的硬规则:`brand` / `bootstrap` 里的图标**没有记录直接报错**;
记录里的 id 没有对应文件也报错。所以"逐个按许可分析"不是靠自觉,是靠构建卡住的。

> 记录里也要写清**没查到什么**(比如"腾讯没有公开的第三方商标政策页")——
> 空白不等于没有约束。

## 索引:catalog.tsv

每行一条,制表符分隔:`<id>\t<desc>`。`desc` 是给人看的说明(中英各一半)。

```
infra/v0:server	服务器 / Server
infra/v0:router	路由器 / Router
```

版本化分类写**具体版本**的键(`infra/v0:server`);别名(`infra:server`)由构建生成,
写进 `catalog.tsv` 构建会报错并告诉你该写哪个键。

`catalog.tsv` 是唯一事实源。`scripts/build.mjs` 会校验它跟 `icons/` 里的文件一一对应 ——
多一行、少一行、id 写错,构建直接报错。

## 加一个图标

1. 把文件放进 `icons/<cat>/`(平铺分类)或 `icons/<cat>/v<n>/`(版本化分类);
   SVG 用 24×24 viewBox,PNG 用 48×48。
2. 在 `catalog.tsv` 里补一行 `<id>\t<说明>` —— 版本化分类写带 `/v<n>` 的具体键。
3. `npm run build` —— 校验通过就生成好了。

新建分类还要在 `scripts/build.mjs` 的 `CATS` 里登记(标题、出处、许可);
版本化分类还要在 `versions.json` 里登记推荐版本;
属于 `brand` / `bootstrap` 的还要补一份 `brands/` 里的许可记录。

## 本地预览

```sh
npm install
npm run build
npm run preview          # http://localhost:8787/
```

或者带 Worker 跑(路由前缀跟线上一致):

```sh
npm run dev              # http://localhost:8787/
```

## 部署

```sh
npm run deploy           # = npm run build && wrangler deploy
npm run deploy:iconbase  # 发到 x-cmd.com/iconbase(另一个 Cloudflare 账号)
```

两个挂载点,同一个 Worker 代码:

| 挂载点 | 域名 | 账号 |
| --- | --- | --- |
| `/icon` | po6.sh/icon | Edwin.jh.lee@gmail.com's Account |
| `/iconbase` | x-cmd.com/iconbase | It@x-cmd.com's Account |

**跨账号加不了路由**,所以是两个 worker 各发一次(`wrangler.jsonc` 里的 `env.iconbase`)。
挂载点由 `vars.MOUNTS` 声明,请求路径的第一段对上才算挂载;静态资源只有一份
(`public/icon/**`),各挂载点都从那儿取。改挂载点改这两处:`vars.MOUNTS` 与 `routes`。

Worker 提供的接口(路径里的 `/icon` 换成所在挂载点):

| 路径 | 内容 |
| --- | --- |
| `/icon` | 查询页(老链接 `/icon/c/<cat>` 会重定向到 `?cat=<cat>`) |
| `/icon/manifest.json` | 图标清单(元数据)—— 静态资源,边缘直发 |
| `/icon/i/<cat>/<file>` | 图标原文件 —— 静态资源,边缘直发 |
| `/icon/api/icons.json?ids=a,b` | `{ "infra:server": "data:image/svg+xml;base64,…" }` |

> 整库两千多个图标,base64 内嵌会超 Worker 体积限制,所以图标文件和清单走静态资源,
> Worker 只负责页面与按 id 取 data URI 的接口。

## 接入 draw

`x-cmd/draw` 里认图标字段的正则是:

```ts
// x-cmd/draw/src/render/archmap.ts
export const ICON_FIELD_RE = /^(?:aws|azure|gcp|org):[a-z0-9][a-z0-9-]*$/;
```

本库的键名跟它是对齐的 —— `aws:`、`azure:`、`gcp:`、`org:` 四个前缀 draw 都已经认。

要接上全部十九个分类,正则要放行"分类/版本"这种形状:

```ts
export const ICON_FIELD_RE = /^(?:aws|azure|gcp|brand|bootstrap|[a-z0-9]+)\/v\d+:[a-z0-9][a-z0-9-]*$/;
```

别名(`infra:server`)与具体版本(`infra/v0:server`)都能取到字节 ——
`/icon/api/icons.json?ids=` 两个键都认,别名指向的就是推荐版本那份文件。

图标字节可以从 `/icon/api/icons.json` 拿(内嵌成 data URI,SVG 和 PNG 输出都带着它)。

## 许可与出处

- 本仓代码与自绘图标:Apache-2.0(见 `LICENSE`)。
- AWS / Azure / GCP 标识:来自各厂商自己的官方图标包
  ([AWS](https://aws.amazon.com/architecture/icons/)、
  [Azure](https://learn.microsoft.com/en-us/azure/architecture/icons/)、
  [Google Cloud](https://cloud.google.com/icons)),原样取 SVG;
  商标归各自权利人所有,不得改色改形。详见 `NOTICE.md`。
- `org:` 那族是自绘抽象符号,与任何公司无商标关联。
- `brand:` 里有一部分取自 Wikimedia Commons(公有领域 + 商标标记),
  见 `licenses/wikimedia-commons/`。
