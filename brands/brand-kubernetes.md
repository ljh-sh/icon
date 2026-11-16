---
id: brand:kubernetes
title: Kubernetes
verdict: ok
source: Kubernetes 项目官方仓 · https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.svg
license: Apache-2.0(文件所在仓库);logo 图形是 Kubernetes 项目的商标
licenseUrl: https://github.com/kubernetes/kubernetes/blob/master/LICENSE
trademarkOwner: The Linux Foundation(CNCF 治理),Kubernetes 项目商标
trademarkPolicy: https://www.linuxfoundation.org/legal/trademark-usage
restrictions: 不得暗示 Linux Foundation / CNCF 背书;不得当作自己的标识;不得改色改形;保留商标声明
reviewed: 2026-11-17
---

## 分析

**文件来源:官方渠道。** 取自 Kubernetes 项目自己的仓库(Apache-2.0),不是从第三方图标站抄的。

**商标:有公开、可引用的政策。** Kubernetes 由 CNCF 治理,其商标归属 Linux Foundation。
LF 的《Trademark Usage》(https://www.linuxfoundation.org/legal/trademark-usage) 写明:

> This is a statement of The Linux Foundation's trademarks and its policy and guidelines relating
> to use of trademarks owned by The Linux Foundation and used by projects under The Linux Foundation.
> Individual projects under The Linux Foundation may have additional guidelines and requirements…

LF 政策允许第三方在指代该项目时使用其标识,并保留"不得暗示背书"这类通用限制;
政策本身也声明 LF 可以随时更新许可声明。

**同一政策覆盖 Prometheus**(见 brand-prometheus.md),所以 k8s 和 prometheus 归到同一批。

## 我们怎么用

- 原样输出官方图形(蓝色 helm 轮),不参与主题着色。
- 只在表示"这是 Kubernetes 集群/组件"时用。
- NOTICE 里保留商标声明。

## 结论

**收录(ok)。** 官方渠道 + 有公开政策 + 指示性引用在许可范围内。
