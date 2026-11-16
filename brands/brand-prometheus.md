---
id: brand:prometheus
title: Prometheus
verdict: ok
source: Prometheus 项目官方仓 · https://raw.githubusercontent.com/prometheus/prometheus/main/documentation/images/prometheus-logo.svg
license: Apache-2.0(文件所在仓库);logo 图形是 Prometheus 项目的商标
licenseUrl: https://github.com/prometheus/prometheus/blob/main/LICENSE
trademarkOwner: The Linux Foundation(CNCF 治理),Prometheus 项目商标
trademarkPolicy: https://www.linuxfoundation.org/legal/trademark-usage
restrictions: 不得暗示 Linux Foundation / CNCF 背书;不得当作自己的标识;不得改色改形;保留商标声明
reviewed: 2026-11-17
---

## 分析

同 Kubernetes:CNCF 项目,商标归属 Linux Foundation,适用 LF 的《Trademark Usage》
(https://www.linuxfoundation.org/legal/trademark-usage)。

prometheus.io 页脚本身也挂着商标声明:

> © 2026 The Linux Foundation. All rights reserved. The Linux Foundation has registered trademarks
> and uses trademarks.

**文件来源是项目官方仓**(Apache-2.0),logo 图形本身是项目商标 —— 这跟
"从第三方图标站拿来的、作者无权授权的图形"是两回事,所以归在 `brand:` 而不是 `bootstrap:`。

## 我们怎么用

- 原样输出官方图形(火焰标志),不参与主题着色。
- 只在表示"这是 Prometheus 监控栈"时用。

## 结论

**收录(ok)。**
