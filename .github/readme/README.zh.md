# 888GA

> 次世代 Cloudflare 简体中文/繁体中文自托管网站数据分析平台 (Next-Gen Cloudflare Web Analytics)  
> 隐私优先、无 Cookie、极速响应，集成 **Clef-Flash System One AI 边缘决策引擎** 与 **本地源柔黑体工匠级排版**，专为独立站长与极致性能追求者深度定制。

<!-- auto-readme-i18n-switcher start -->
| [English](/.github/readme/README.en.md) | [日本語](/.github/readme/README.ja.md) | [中文（台灣）](/.github/readme/README.zh-tw.md) | 中文 |
<!-- auto-readme-i18n-switcher end -->

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](/LICENSE)
[![Release: v0.8.0](https://img.shields.io/badge/Release-v0.8.0-emerald.svg)](/changelog/v0.8.0.md)

---

## 📸 系统仪表盘预览 (Dashboard Preview)

![888GA 仪表盘示范数据](/docs/images/dashboard-overview-zh.png)

---

## 🎮 免配置 Demo 示范账号 (Instant Demo Sandbox)

想要在不修改任何数据库、无需部署云端资源的情况下体验 888GA？系统已内置专属演示账号：

- **演示账号**：`demo`
- **演示密码**：`demo`

### 示范环境特色
- **三大真实感示范站点**：登录即可切换查看「企业形象官网 (Corporate)」、「电商购物商城 (E-commerce)」以及「SaaS 云端平台 (SaaS App)」。
- **丰富示范数据**：包含实时访问人次、访客国家分布地图、各操作系统与浏览器占比、转化漏斗与跳出率趋势。
- **零信任只读保护 (Zero-Trust Mutation Guard)**：所有写入与配置修改请求（`POST`, `PUT`, `PATCH`, `DELETE`）在边缘中间件层皆会被安全拦截并返回 `403 Forbidden` (`demo_read_only`)，确保演示环境始终纯净不被变更。

---

## 💡 致敬与开源传承 (Acknowledgments & Heritage)

**888GA** 是基于优秀开源项目 [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare) 发展的独立进阶定制分支。

在此向原作者 **RavelloH** 在边缘计算与轻量化分析领域的前瞻性贡献致以崇高敬意！

---

## ⚡️ 888GA 与原作者版本（InsightFlare）的深度分差

虽然延续了 Cloudflare Workers 边缘计算的核心优势，但 888GA 针对原版在「字体视觉痛点」、「导航卡顿延迟」、「缺乏智能诊断」与「缺乏开箱即用演示」等关键层面进行了彻底重构与升级：

| 评比维度 | 原版 InsightFlare | 888GA 进阶分支 (v0.8.0) |
| :--- | :--- | :--- |
| **AI 决策与诊断** | ❌ 无（仅静态数据库指标统计） | ✅ **Clef-Flash System One 决策引擎**（<200ms 极速诊断、自动根因分类、健康评分、爬虫防御） |
| **排版与字体栈** | 依赖远程 `.woff` 下载；大量 10~11px 微型字体，中文环境笔画挤压模糊 | ✅ **纯本地零依赖**：JetBrains Mono（英数代码）+ 源柔黑体（Gen Jyuu Gothic），无网络请求、守护 13px 清晰底线 |
| **页面导航体验** | 强制等待 280ms 退出动画，点击有延迟感 | ✅ **零人工延迟**：移除多余等待，启用 TanStack Router `intent` 预载与内存缓存（30s~60s），鼠标滑过预取，点击 0ms 瞬开 |
| **演示与评估** | 需仰赖作者外部展示站，无内置免安装 Demo 账号 | ✅ **内置 `demo`/`demo` 只读沙盒**，预载 3 组站点完整数据，边缘安全中间件阻断写入 |
| **告警通知加值** | 仅发送单纯数值超标文字通知 | ✅ **AI 智能通知**：告警邮件/Webhook 自动附带 Clef AI 根因推断分析与改善建议指引 |
| **独立站长 UX** | 偏向复杂的多层级 SaaS 团队管理流程 | ✅ **站长第一优先**：一键开启 HTML 追踪码弹窗与 3 步骤快速指引、直观的多站切换切换面板 |
| **语言与本地化** | 简中与英文为主，繁中语系缺漏不全 | ✅ **完整繁体中文 (zh-TW) 与简体中文 (zh-CN)** 第一等公民支持，涵盖配置、图表、工具提示与系统告警 |
| **边缘安全防御** | 基础传输 | ✅ **敏感标头过滤**（Cookie/Auth 自动脱敏）、输入长度截断保护、时戳回退校验 |

---

## 🌟 核心革新功能解析

### 1. 🤖 Clef-Flash System One AI 决策引擎
888GA 首度在边缘分析系统中导入超轻量、低延迟（<200ms）的 System One 决策推断机制，并建立坚实的三层备援容灾线路：
- **Primary 节点**：自建极速节点（免外部 Token 计费，延迟小于 200ms）。
- **Fallback 2 节点**：自建跨区域备援节点。
- **Fallback 3 节点**：TypeSafe 官方高可用服务。

**三大核心 AI 决策能力**：
- **站点健康评估 (`site-health`)**：自动分析跳出率、服务器响应时间、错误率与访问真实度，输出 1~5 星健康评级与改善重点。
- **异常事件分流 (`anomaly-triage`)**：流量突增或骤降时，自动定级紧急程度（P0 致命 ～ Noise 杂讯），并识别可能成因（源站服务器宕机、恶意爬虫大量扫描、前端追踪码失效、常态离峰波动）。
- **边缘访客与爬虫防御 (`bot-defense`)**：综合评估请求特征、Client Hints 与行为频率，向 Cloudflare 边缘建议处理策略（`allow`、`challenge_turnstile`、`block_or_drop`）。

### 2. 🔤 本地零网络依赖字体：JetBrains Mono + 源柔黑体
- **英数与数字**：采用最具工程美感的 **JetBrains Mono**。
- **中文与界面**：采用圆润柔和、极度清晰的 **Gen Jyuu Gothic（源柔黑体）**。
- **完全零外部网络请求**：移除 `@fontsource` 与所有远程 `.woff` / `.woff2` 预载链，彻底杜绝字体引发的页面布局位移 (CLS) 与网络延迟，更有效保障访客隐私不向字体 CDN 外流。
- **13px 笔画清晰度防护底线**：重整阶梯尺度，确保任何密集指标与表格数据均能舒畅阅读。

### 3. ⚡️ 零延迟 SPA 导航与 TanStack Router 预载
- 移除原版 280ms 的退出动画等待。
- 鼠标 Hover 导航项目时即时预加载数据（`intent`），内存缓存自动合并重复请求，实现 0ms 瞬间切换。

---

## 🚀 快速开始 (Quick Start)

### 方式一：一键部署至 Cloudflare Workers

点击下方按钮即可一键部署至您自己的 Cloudflare 账户：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)

部署过程中需填写以下环境变量：

| 变量名称 | 必要性 | 用途说明 |
| :--- | :---: | :--- |
| `MAIN_SECRET` | **必填** | 核心加密密钥（长度大于 16 位的随机字符串，用于访客隐私加盐哈希、Session 签名与 Token 加密） |
| `BOOTSTRAP_ADMIN_PASSWORD` | **必填** | 初始管理员密码（账号预设为 `admin`，登录后可于个人资料修改） |
| `CLEF_API_URL` | 选填 | Clef-Flash AI 主要端点（默认支持 `https://clef.create360.ai/v1/systemone`） |
| `CLEF_FALLBACK_URL` | 选填 | Clef-Flash AI 备援端点（默认支持 `https://clef.aiurl.tw/v1/systemone`） |
| `TYPESAFE_API_KEY` | 选填 | TypeSafe 官方第三层备援密钥 |

### 方式二：本地开发与测试

```bash
# 1. 克隆项目
git clone https://github.com/tbdavid2019/888GA.git
cd 888GA

# 2. 安装依赖
pnpm install

# 3. 启动本地 Demo 演示模式（包含示范数据与 demo/demo 账号）
pnpm run dev:ui
```

浏览器打开 `http://localhost:3000`，输入账号 `demo`、密码 `demo` 即可立即开始探索！

---

## 📄 开源授权 (License)

本项目基于 [MIT 授权条款](/LICENSE) 开源释出。  
衍生自 [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare) (Copyright © 2026 RavelloH)。  
888GA 定制分支由 [tbdavid2019](https://github.com/tbdavid2019) 持续维护与演进。
