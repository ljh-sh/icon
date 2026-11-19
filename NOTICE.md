# NOTICE

## 本仓自绘的部分

`icons/` 下各分类 `v0/` 目录里的 SVG 由本仓自行绘制,随本仓以 Apache-2.0 发布。

`icons/org/` 下的是**抽象几何符号**,不是任何公司的商标图形,与相应公司无关联。

## 第三方素材

`icons/aws/`、`icons/azure/`、`icons/gcp/`、`icons/aliyun/`、`icons/oci/`、`icons/ibm/` 下的是**厂商官方图标包**里的服务标识,
直接取原厂的 SVG(矢量),不再经第三方转手:

| 分类 | 来源 | 取用方式 |
| --- | --- | --- |
| `icons/aws/` | [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) 官方图标包(2026-07 版) | `Architecture-Service-Icons/` 与 `Resource-Icons/` 下的服务/资源标识,SVG 原样 |
| `icons/azure/` | [Microsoft Azure Public Service Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) 官方图标包(V25) | `Icons/` 下各分类的服务标识,SVG 原样 |
| `icons/gcp/` | [Google Cloud 产品图标](https://cloud.google.com/icons) 官方图标集 | 各产品标识,SVG 原样 |
| `icons/aliyun/` | 阿里云官方矢量图标包(2022 橙) | 官方包的中英双语两套,按图形配对取英文那套,中文名来自官方中文文件名 |
| `icons/oci/` | Oracle OCI Architecture Icons(V24.2) | 官方包里的服务标识,SVG 原样 |
| `icons/ibm/` | [IBM Cloud architecture-icons](https://github.com/IBM-Cloud/architecture-icons) | 官方仓里的 drawio 模板,模板内嵌的 SVG 原样取出 |

导入时做的处理(不动图形本身):

- 去掉 `<title>` / `<desc>`,把内部 `id` 加上分类前缀改成全局唯一
  (几十个图标合进一张 sprite,id 撞了会串色)
- GCP 的图标用 CSS class 上色,已把 class 规则展开成写死的 `fill` ——
  否则进了 sprite 之后几十条 `.cls-1` 会互相覆盖
- Azure 的渐变(`url(#…)`)引用同步改过
- 阿里云那套官方包里每个图标的中英文名分两个目录放,按图形内容配对;
  IBM 的图标内嵌在 drawio 模板里(base64 的 SVG),取出后补回 `xmlns:xlink`

**商标**:这些是 AWS / Microsoft / Google / 阿里云 / Oracle / IBM 的商标,权归各自权利人所有。
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

## 按厂家分的分类

每个厂家一个独立分类,方便管理:

| 分类 | 来源 | 授权 |
| --- | --- | --- |
| `icons/aws/` | AWS Architecture Icons 官方包 | 厂商商标,见上 |
| `icons/azure/` | Microsoft Azure Public Service Icons 官方包 | 厂商商标,见上 |
| `icons/gcp/` | Google Cloud 官方图标集 | 厂商商标,见上 |
| `icons/aliyun/` | 阿里云官方矢量图标包 | 厂商商标,见上 |
| `icons/oci/` | Oracle OCI Architecture Icons 官方包 | 厂商商标,见上 |
| `icons/ibm/` | IBM Cloud architecture-icons 官方仓 | 厂商商标,见上 |
| `icons/programming/` | [Simple Icons](https://simpleicons.org) | CC0 |
| `icons/firebase/` | [Simple Icons](https://simpleicons.org) | CC0 |
| `icons/elastic/` | [Simple Icons](https://simpleicons.org) | CC0 |
| `icons/digitalocean/` | [Simple Icons](https://simpleicons.org) | CC0 |
| `icons/iconpark/` | [IconPark](https://github.com/bytedance/IconPark)(字节跳动) | Apache-2.0 |
| `icons/twemoji/` | [Twemoji](https://github.com/jdecked/twemoji)(Twitter) | MIT |
| `icons/noto/` | [Noto Emoji](https://github.com/googlefonts/noto-emoji)(Google) | OFL-1.1 |
| `icons/fluent/` | [Fluent Emoji](https://github.com/microsoft/fluentui-emoji)(微软) | MIT |

emoji 的**名字**另有两处来源(不是图形):英文名取 Unicode 的 `emoji-test.txt`
(UTS #51),中文名取 CLDR 的 `common/annotations/zh.xml` —— 都是 Unicode 数据,
Unicode License / Unicode-3.0 许可。

IconPark 是整库搬入:图形是多色填充风(蓝 + 深色描边),著作权 Apache-2.0,干净。
**品牌类 83 个图标没收**(Adobe / Apple / 微信 / 支付宝这类商标图形),
名字里带品牌的也一并排除(weixin-* / bytedance-* / apple-* / ios-*)。

导入时唯一的改动:官方那套的**纯黑描边**换成了 `currentColor` ———
页面上深浅色主题下描边都得看得见(黑描边在暗色主题里等于没有)。
图形、颜色搭配、笔触粗细都没动;单独当文件用时 `currentColor` 就是黑色,跟官方一致。

emoji 那三个集也是整库搬入,同样**不进 sprite**(加起来 52 MB,一张 sprite 没人下得起),
页面按文件引。Noto 是 OFL-1.1 —— 许可与版权声明随附:
<https://github.com/googlefonts/noto-emoji/blob/main/LICENSE>。
另外 Noto 的 SVG 里渐变 id 都叫 `radial-gradient`,单文件用没事;
哪天要进 sprite,得先给 id 加前缀。

Simple Icons 的图形是 CC0 ✓(著作权干净),但**商标还是各家的** ——
按各家的品牌指引用,不得暗示背书。

**只收 SVG**:构建时发现非 SVG 的图标文件直接报错(其它格式不接受)。

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
