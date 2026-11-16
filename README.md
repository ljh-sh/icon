# x-cmd/icon

给 [x-cmd/draw](https://github.com/x-cmd/draw) 画架构图用的图标库。

两类东西放在一起:

- **云厂商官方标识** —— AWS / Azure / GCP,来自开源项目
  [mingrammer/diagrams](https://github.com/mingrammer/diagrams)(Apache-2.0),缩到 48×48。
- **本仓自绘的通用概念** —— 服务器、磁盘阵列、路由器、显示器、桌面应用这类没有厂商归属的东西,
  24×24 网格、彩色填充的 SVG。

查询页:**https://po6.sh/icon**

## 键名规范

```
<cat>:<concept>
```

`cat` 是分类,`concept` 是分类内的概念名。分类按**素材从哪来、许可怎么算**分:

| cat | 来源 | 含义 | 许可怎么算 |
| --- | --- | --- | --- |
| `aws` `azure` `gcp` | 云厂商官方架构图标包 | 云服务 | Apache-2.0 素材(官方发布的图标包,明确用于画图) |
| `infra` | 本仓自绘 | 通用基础设施概念 | 本仓 Apache-2.0 |
| `org` | 本仓自绘 | 公司与机构的**抽象符号** | 本仓 Apache-2.0,不含任何商标图形 |
| `brand` | 品牌方官方渠道 | 官方 mark | **逐个按该品牌的条款分析**,记在 `brands/` 里 |
| `bootstrap` | 第三方图标库(Bootstrap Icons) | 第三方画的品牌图标 | 著作权 MIT;商标是"夹带"的,只能指示性引用 |

例:`aws:ec2`、`infra:disk-array`、`org:openai`、`brand:kubernetes`、`bootstrap:alipay`。

> `org:` 那一族是**自绘的抽象符号**,不含任何公司的商标图形 —— 公开分发不能带别人的 mark。
> 想要真正的 logo,走 `brand:`(官方渠道)或 `bootstrap:`(第三方库),两者都要有许可记录。

## 目录

```
icons/<cat>/<concept>.<ext>   图标原文件(svg 或 png)
catalog.tsv                    索引:<id>\t<desc>,一行一个
brands/<cat>-<concept>.md      品牌图形的许可记录(brand / bootstrap 必须有)
scripts/build.mjs              校验 + 生成(src/gen.ts、src/page.ts、dist/)
scripts/serve.mjs              本地静态预览
site/                          查询页(index.html / style.css / app.js)
src/index.ts                   Worker:把库挂在 po6.sh/icon 上
src/gen.ts                     生成物:图标字节 + 元数据
src/page.ts                    生成物:CSS/JS 内联后的页面
```

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
infra:server	服务器 / Server
infra:router	路由器 / Router
```

`catalog.tsv` 是唯一事实源。`scripts/build.mjs` 会校验它跟 `icons/` 里的文件一一对应 ——
多一行、少一行、id 写错,构建直接报错。

## 加一个图标

1. 把文件放进 `icons/<cat>/`(SVG 用 24×24 viewBox,PNG 用 48×48)。
2. 在 `catalog.tsv` 里补一行 `<id>\t<说明>`。
3. `npm run build` —— 校验通过就生成好了。

新建分类还要在 `scripts/build.mjs` 的 `CATS` 里登记(标题、出处、许可);
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
```

挂在 `po6.sh/icon` 下(路由写在 `wrangler.jsonc` 的 `routes`)。换域名改那一行。

Worker 提供的接口:

| 路径 | 内容 |
| --- | --- |
| `/icon` | 查询页(深链 `/icon/c/<cat>`、`/icon/c/<cat>#<id>` 也走这里) |
| `/icon/manifest.json` | 图标清单(元数据) |
| `/icon/i/<cat>/<file>` | 图标原文件 |
| `/icon/api/icons.json` | `{ "infra:server": "data:image/svg+xml;base64,…" }` |

## 接入 draw

`x-cmd/draw` 里认图标字段的正则是:

```ts
// x-cmd/draw/src/render/archmap.ts
export const ICON_FIELD_RE = /^(?:aws|azure|gcp|org):[a-z0-9][a-z0-9-]*$/;
```

本库的键名跟它是对齐的 —— `aws:`、`azure:`、`gcp:`、`org:` 四个前缀 draw 都已经认,
只要把 `infra` 加进去(`/^(?:aws|azure|gcp|infra|org):[a-z0-9][a-z0-9-]*$/`)就能用上全部五个分类。

图标字节可以从 `/icon/api/icons.json` 拿(内嵌成 data URI,SVG 和 PNG 输出都带着它)。

## 许可与出处

- 本仓代码与自绘图标:Apache-2.0(见 `LICENSE`)。
- AWS / Azure / GCP 标识:来自 [mingrammer/diagrams](https://github.com/mingrammer/diagrams),Apache-2.0;
  商标归各自权利人所有。详见 `NOTICE.md`。
- `org:` 那族是自绘抽象符号,与任何公司无商标关联。
