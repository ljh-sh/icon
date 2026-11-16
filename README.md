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

`cat` 是分类,`concept` 是分类内的概念名。分类分两类:**外来的**和**我们自己的**。

| cat | 哪来的 | 含义 | 数量 |
| --- | --- | --- | --- |
| `aws` | 外部 | AWS 服务 | 49 |
| `azure` | 外部 | Azure 服务 | 9 |
| `gcp` | 外部 | GCP 服务 | 11 |
| `infra` | 自有 | 通用基础设施概念 | 23 |
| `org` | 自有 | 公司与机构 | 2 |

外部那三个分类来自 [mingrammer/diagrams](https://github.com/mingrammer/diagrams)(Apache-2.0),
是云厂商的官方标识;自有那两个分类是本仓画的,不含任何厂商归属。

例:`aws:ec2`、`infra:disk-array`、`org:openai`。

> `org:` 那一族是**自绘的抽象符号**,不含任何公司的商标图形 —— 公开分发不能带别人的 mark。
> 想要真正的 logo,得另找有授权的来源。

## 目录

```
icons/<cat>/<concept>.<ext>   图标原文件(svg 或 png)
catalog.tsv                    索引:<id>\t<desc>,一行一个
scripts/build.mjs              校验 + 生成(src/gen.ts、src/page.ts、dist/)
scripts/serve.mjs              本地静态预览
site/                          查询页(index.html / style.css / app.js)
src/index.ts                   Worker:把库挂在 po6.sh/icon 上
src/gen.ts                     生成物:图标字节 + 元数据
src/page.ts                    生成物:CSS/JS 内联后的页面
```

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

新建分类还要在 `scripts/build.mjs` 的 `CATS` 里登记(标题、出处、许可)。

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
