# NOTICE

## 本仓自绘的部分

`icons/` 下各分类 `v0/` 目录里的 SVG 由本仓自行绘制,随本仓以 Apache-2.0 发布。

`icons/org/` 下的是**抽象几何符号**,不是任何公司的商标图形,与相应公司无关联。

## 第三方素材

`icons/aws/`、`icons/azure/`、`icons/gcp/` 下的是**云厂商官方图标包**里的服务标识,
直接取原厂的 SVG(矢量),不再经第三方转手:

| 分类 | 来源 | 取用方式 |
| --- | --- | --- |
| `icons/aws/` | [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) 官方图标包(2026-07 版) | `Architecture-Service-Icons/` 与 `Resource-Icons/` 下的服务/资源标识,SVG 原样 |
| `icons/azure/` | [Microsoft Azure Public Service Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) 官方图标包(V25) | `Icons/` 下各分类的服务标识,SVG 原样 |
| `icons/gcp/` | [Google Cloud 产品图标](https://cloud.google.com/icons) 官方图标集 | 各产品标识,SVG 原样 |

导入时做的处理(不动图形本身):

- 去掉 `<title>` / `<desc>`,把内部 `id` 加上分类前缀改成全局唯一
  (几十个图标合进一张 sprite,id 撞了会串色)
- GCP 的图标用 CSS class 上色,已把 class 规则展开成写死的 `fill` ——
  否则进了 sprite 之后几十条 `.cls-1` 会互相覆盖
- Azure 的渐变(`url(#…)`)引用同步改过

**商标**:这些是 AWS / Microsoft / Google 的商标,权归各自权利人所有。
官方图标包本身就是给画架构图用的,本仓的用途(x-cmd/draw 画架构图)落在其许可范围内;
但**不得**改色改形,也不得暗示与厂商有合作或背书关系。

有 4 个键厂商从来没发布过对应的服务标识,拿不到官方 SVG,已经**从库里删掉**
(留档与逐条原因见 issue #6):

```
aws/quicksight   AWS 现行图标包里没有 QuickSight 标识
aws/es           Elasticsearch 已被 OpenSearch 取代,包里只剩 OpenSearch
                 —— 语义由 aws:opensearch 接手,它的描述里带了 "formerly Elasticsearch"
azure/container  Azure 公开图标包(V16–V25 都查过)没有 Container Apps 服务标识,
                 只有 Container-Apps-Environments(图形不同,不是同一个标识)
azure/blob       同上,没有 Blob Storage 服务标识(Storage-Accounts 是另一个图形)
```

`azure/ad` 原来也是 PNG,已换成 Microsoft 官方包(V16)里的 `Azure-Active-Directory`
—— 与原 PNG 是同一个图形,已逐个比对过。

## 早期版本里的第三方素材

2026-11-17 之前,`icons/aws/`、`icons/azure/`、`icons/gcp/` 下的图标是
[mingrammer/diagrams](https://github.com/mingrammer/diagrams)(Apache-2.0,
Copyright the mingrammer/diagrams contributors)的 `resources/` 目录下的 PNG,
缩到 48×48 并量化了调色板。那批 PNG 已经从本仓移除,历史里仍可取回。

## 品牌图形(icons/brand/、icons/bootstrap/)

这两类目录里的图标是**第三方品牌的图形**:

- `icons/brand/` —— 取自品牌方官方渠道(项目自己的仓库、官方素材页)、
  [Simple Icons](https://simpleicons.org)(CC0)、或 [Wikimedia Commons](https://commons.wikimedia.org)
  (公有领域模板 + 商标标记,见 `licenses/wikimedia-commons/`)
- `icons/bootstrap/` —— 取自 [Bootstrap Icons](https://github.com/twbs/icons)
  (MIT, Copyright (c) 2019-2024 The Bootstrap Authors)

每个图标在 `brands/<cat>-<concept>.md` 里有一份许可记录:著作权许可、商标权人、
官方商标政策、使用限制、我们的结论,以及**没查到什么**。

记录的结论分三档:`ok`(可收录)、`caution`(收录但限指示性引用)、`withheld`(不发布)。

这些图形的商标权归各自权利人所有;上面那份著作权许可只覆盖素材本身的著作权,
不构成商标授权。使用限制逐条见各自的记录文件。

`icons/github/` 的每个图标右上角有一枚 GitHub 官方 mark(黑猫),作次要位置,
表示"这是 GitHub 的概念"。GitHub 商标政策(https://github.com/logos)明确允许
这种"表示集成"的用法(Show integration / Secondary placement),且要求不得改色改形 ——
所以那枚 mark 原样输出黑色,其余部分是本仓自绘。依据见
`brands/bootstrap-github.md`。

图形取自 [Bootstrap Icons](https://github.com/twbs/icons) 里的 `github`
(MIT),跟 `icons/bootstrap/github` 是同一份。

两处处理:

- mark 底下垫了一块**白色的实底**。官方 mark 头上那块是镂空的,压在彩色对象上
  会透出底色(黑、紫糊成一块);垫白之后"白色的身体"不受背景影响,图形与颜色
  本身没动。
- 整枚 mark **70% 不透明** —— 要透一点底色,不跟底下的对象抢。

`icons/k8s/` 的每个图标右上角是 Kubernetes 官方 logo(官方蓝 #326ce5):
取自 [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes) 仓库的
`logo/logo.svg`,授权 **CC BY 4.0**(商标 © The Kubernetes Authors)。
同样是底下垫白实底 + 整枚 70% 不透明。

`icons/sec/` 右上角的盾是**本仓自绘的**抽象图形(白底深色描边),与商标无关。
