---
id: bootstrap:github
title: GitHub
verdict: ok
source: Bootstrap Icons 1.13.1 · https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/github.svg
license: MIT(图标素材的著作权)
licenseUrl: https://github.com/twbs/icons/blob/main/LICENSE
trademarkOwner: GitHub, Inc.
trademarkPolicy: https://github.com/logos
restrictions: 不得暗示 GitHub 背书;不得当作自己的标识;不得改色改形;置于次要位置
reviewed: 2026-11-17
---

## 分析

**著作权:干净。** 同 Bootstrap Icons 全仓 MIT。

**商标:有公开政策,且明确允许我们要的用法。** GitHub 的商标政策(https://github.com/logos)
明确把"表示集成关系"列为许可用法:

> Show integration — Use a permitted GitHub logo to inform others that your project integrates with GitHub.
> Secondary placement — Use the permitted GitHub logos less prominently than your own company
> or product name or logo.

明确禁止的是:

> Imply affiliation — Do not use the GitHub name or any GitHub logo in a way that suggests you
> are GitHub… or that GitHub is endorsing you…
> Use as your logo / Modify the logo — Do not modify the permitted GitHub logos, including changing
> the color, dimensions… / Use without permission.

架构图里"这个节点是 GitHub / 我们接了 GitHub"正是"Show integration"的场景,落在许可用法里。

**注意"Do not modify… changing the color"。** 这条跟本仓的技术实现直接冲突:
Bootstrap Icons 的 SVG 是 `fill="currentColor"`,单独内联进 draw 的图里会按渲染器给的颜色着色 ——
那就等于改色。所以 `bootstrap:` 分类的图标**不能参与主题着色**,得原样出。

## 我们怎么用

- 只在表示"集成/依赖 GitHub"的图里用,置于次要位置。
- 图标原样输出(单色 currentColor → 渲染成黑),不跟随节点语义色。
- 不与自己的品牌名并列成"lockup",不做任何变形。

## 结论

**收录(ok)。** 政策明确、用法明确、与架构图场景吻合。
