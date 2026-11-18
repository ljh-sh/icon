# 图标源清单 —— 商业可用、免费

查过的源,以及**要不要进本库**的结论。查的时候(2026-11)逐个核了官方仓的 LICENSE 文件。

## 进本库的原则

1. **只收 SVG** —— 构建时发现非 SVG 直接报错。字体(woff/ttf)、PNG 一律不要。
2. **著作权要干净** —— MIT / Apache-2.0 / ISC / CC0 这类许可可以直接进;
   CC-BY / CC-BY-SA 要署名(CC-BY-SA 还有传染性),GPL 不用。
3. **商标是另一回事** —— 图形本身的著作权许可 ≠ 商标授权。
   厂商标识、服务标识按各家的品牌指引用;拿不到官方 SVG 的**不收**。
4. **画风** —— 本库自绘那批是**填色风**(拟物、彩色);
   厂商官方包是"原样 SVG"(不改色改形)。线稿风(纯描边)跟自绘那批不合,
   除非它补的是自绘补不上的概念,否则不引进。

## 已经进了的

| 分类 | 来源 | 许可 | 画风 | 说明 |
| --- | --- | --- | --- | --- |
| `aws` | AWS Architecture Icons 官方包 | 厂商商标 | 原样 | 服务标识 |
| `azure` | Microsoft Azure Public Service Icons | 厂商商标 | 原样 | 服务标识 |
| `gcp` | Google Cloud 官方图标集 | 厂商商标 | 原样 | 服务标识 |
| `aliyun` | 阿里云官方矢量图标包(2022 橙) | 厂商商标 | 原样 | 服务标识 |
| `oci` | Oracle OCI Architecture Icons(V24.2) | 厂商商标 | 原样 | 服务标识 |
| `ibm` | IBM Cloud architecture-icons | 厂商商标 | 原样 | 架构图标 |
| `programming` `firebase` `elastic` `digitalocean` | Simple Icons | CC0 | 单色 | 品牌标识 |
| `bootstrap` | Bootstrap Icons | MIT | 线稿 | 整库搬入 |
| `iconpark` | ByteDance IconPark | Apache-2.0 | 多彩填充 | 整库搬入(品牌类不收) |
| `infra` `db` `sec` `k8s` `dev` … 二十来个 | 本仓自绘 | Apache-2.0 | 拟物填色 | |

## 查过、暂时不进的

| 源 | 许可 | 画风 | 结论 |
| --- | --- | --- | --- |
| [Material Design Icons](https://github.com/google/material-design-icons) | Apache-2.0 | 填充单色 | ⬜ 画风贴,但它那套偏 UI 控件,跟架构图概念对不上;要进当"素材池",等有具体需求再说 |
| [Tabler Icons](https://github.com/tabler/tabler-icons) | MIT | 线稿 | ⬜ 线稿风,不合;量最大(6k+),以后要补概念时优先考虑 |
| [Lucide](https://github.com/lucide-icons/lucide) | ISC | 线稿 | ⬜ 同上;跟 Tabler 重叠度高,选一个就够 |
| [Heroicons](https://github.com/tailwindlabs/heroicons) | MIT | 描边 + 实心 | ⬜ 实心那版可以用,量小(300+) |
| [Carbon Icons](https://github.com/carbon-design/carbon) | Apache-2.0 / Unlicense | 单色 | ⬜ IBM 自家那套,跟 `ibm:` 重叠;单色,不合画风 |
| [Phosphor](https://github.com/phosphor-icons/web) | MIT | 六种字重(含填色/双色) | ⬜ 双色那版合画风,量够(9k+);**候选**,等自绘补不上的时候引进 |
| [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) | MIT | 实心 | ⬜ 合画风,量够(20k+);**候选** |
| [Remix Icon](https://github.com/remix-design/remixicon) | 自有许可 v1.0 | 线稿/填色混 | ⬜ 许可不是标准 SPDX,得逐条读,先放着 |
| [Boxicons](https://boxicons.com) / [Iconoir](https://github.com/iconoir-icons/iconoir) | MIT | 线稿 | ⬜ 线稿,量一般 |
| [Devicon](https://github.com/devicons/devicon) | MIT | 品牌标识 | ⬜ 品牌多,商标风险高;要走 `brand:` 的许可记录流程,不能整库搬 |
| [Healthicons](https://github.com/resolvetosavelives/healthicons) | CC0(图标)/ MIT(站点) | 线稿 | ⬜ 图形干净(CC0)可以进,但医疗主题还没需求 |
| [Twemoji](https://github.com/jdecked/twemoji) | MIT | 彩色表情 | ⬜ 色彩艳丽,跟本库画风差得远;想加"表情"分类再说 |
| [Noto Emoji](https://github.com/googlefonts/noto-emoji) | OFL-1.1 | 彩色表情 | ⬜ 同上 |
| [OpenMoji](https://github.com/hfg-gmuend/openmoji) | CC-BY-SA-4.0 | 彩色表情 | ⬜ **CC-BY-SA 传染**,不收 |
| [Solar](https://github.com/paradigmxyz/solar) | Apache-2.0 | 描边/填色/双色调 | ⬜ 双色调那版合画风,**候选** |
| [Hugeicons](https://github.com/hugeicons/hugeicons) | MIT | 描边/实心/双色 | ⬜ 双色合画风,**候选** |
| [Google Material Symbols](https://fonts.google.com/icons) | Apache-2.0 | 变字体 | ⬜ 是**可变字体**,不是 SVG 文件;要导成 SVG 才能进,多一道工序 |
| [Font Awesome Free](https://fontawesome.com) | 图标 CC-BY-4.0 / 代码 MIT | 实心 | ⬜ **要署名**;且已有 Bootstrap Icons 顶上了 |
| [Iconify](https://iconify.design) | 聚合器,逐个集自己的许可 | 各式 | ⬜ 不是独立素材源,是"检索入口" —— 找到集之后仍要去该集的官方仓取 |

## 厂商官方包(还在找 / 已核过)

| 厂商 | 状态 |
| --- | --- |
| Cisco Network Topology Icons | ❌ 官方只发 EPS/JPG/Visio/PPT,**拿不到 SVG**;条款还写明"不得改形改色",转 SVG 等于改形 |
| 华为 | ❌ 没找到可下载的同类官方包 |
| OpenStack | ⬜ 官方服务标识没找到成套的 SVG 包 |
| Outscale | ⬜ 同上 |
| Kubernetes 组件标识 | ⬜ 官方 `kubernetes/community/icons` 只有社区/生态项目的标识;API Server 这类"组件"没有官方图形,本库的 `k8s:` 仍是自绘抽象符号 |

## 结论

- **可商用且干净的**:MIT / Apache-2.0 / ISC / CC0 / OFL —— 这一批里的
  Material Design Icons、Fluent、Phosphor、Solar、Hugeicons、Tabler 都能直接进,
  只差画风合不合。
- **要小心的**:CC-BY(要署名)、CC-BY-SA(传染)、厂商图标包(商标归厂商,
  不得改色改形、不得暗示背书)、以及**只有 PNG 的官方包**(只收 SVG,拿不到就换)。
- **mingrammer/diagrams** 在本仓里的角色是**清单**不是**素材源**:
  它列了每个厂家覆盖哪些服务,图形回各厂官方包取。
