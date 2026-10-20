# 888GA

> Next-Gen Cloudflare Web Analytics  
> Privacy-friendly, cookie-free, ultra-fast, and powered by **Clef-Flash System One Edge AI Decision Engine** with native **JetBrains Mono + Gen Jyuu Gothic (源柔黑體)** local typography.

<!-- auto-readme-i18n-switcher start -->
| English | [日本語](/.github/readme/README.ja.md) | [中文（台灣）](/.github/readme/README.zh-tw.md) | [中文](/.github/readme/README.zh.md) |
<!-- auto-readme-i18n-switcher end -->

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](/LICENSE)
[![Release: v0.8.0](https://img.shields.io/badge/Release-v0.8.0-emerald.svg)](/changelog/v0.8.0.md)

---

## 📸 Dashboard Overview

![888GA Dashboard Overview with Demonstration Data](/docs/images/dashboard-overview-en.png)

---

## 🎮 Instant Demo Sandbox (`demo` / `demo`)

Want to explore the capabilities of 888GA without setting up Cloudflare resources or a local database?

- **Username**: `demo`
- **Password**: `demo`

### Demo Sandbox Features:
- **3 Realistic Demonstration Sites**: Explore data patterns across Corporate Portal, E-commerce Store, and SaaS Application.
- **Rich Interactive Metrics**: Live simulated visitors, geographic distribution, operating system and browser share, goal funnels, and bounce rate trends.
- **Zero-Trust Read-Only Protection**: All mutation requests (`POST`, `PUT`, `PATCH`, `DELETE`) are safely rejected with `403 Forbidden` (`demo_read_only`), guaranteeing a reliable and pristine demo experience.

---

## 💡 Acknowledgments & Heritage

**888GA** is an independent, customized, and production-hardened fork of [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare).

We extend our sincere gratitude to the original author **RavelloH** for the visionary serverless architecture and open source contribution!

---

## ⚡️ Deep Divergence & Architecture Enhancements

While preserving the 100% serverless edge runtime, 888GA addresses critical real-world challenges in performance, readability, and operational intelligence:

| Dimension | Upstream InsightFlare | 888GA Fork (v0.8.0) |
| :--- | :--- | :--- |
| **Edge AI Decision Engine** | ❌ None (pure static counts / SQL queries) | ✅ **Clef-Flash System One** (<200ms latency, 3-tier resilient failover, automated site health diagnosis, incident triage, bot defense classification) |
| **Typography & Fonts** | Remote `.woff` downloads, cramped 10-11px Latin fonts (blurry and crowded for CJK characters) | ✅ **100% Local Font Stack**: JetBrains Mono + Gen Jyuu Gothic (源柔黑體), zero remote font requests, no layout shift (CLS), 13px stroke legibility floor |
| **SPA Navigation** | Artificial 280ms exit animation transition delay | ✅ **0ms Instant Switching**: TanStack Router `intent` preloading + 30-60s memory caching |
| **Demo Sandbox** | External demo URL, no built-in sandbox account | ✅ **Built-in `demo`/`demo` credentials** with 3 realistic mock sites and edge read-only mutation guard |
| **Notification Intelligence** | Basic raw threshold alerts | ✅ **AI-Enriched Alerts**: Anomaly alerts include Clef AI root-cause diagnostic insights and mitigation tips |
| **Webmaster UX** | Multi-level SaaS organization hierarchy | ✅ **Webmaster-First UX**: 1-click HTML tracking snippet dialog, 3-step setup guide, streamlined site switcher |
| **Localization** | Simplified Chinese / English focus | ✅ **Traditional Chinese (zh-TW)** first-class support across all views, chart labels, and notification emails |
| **Edge Security Hardening** | Standard headers | ✅ Strips sensitive headers (`Cookie`, `Auth`, `X-API-Key`) before AI telemetry; token length clamping against payload abuse |

---

## 🌟 Core Innovations

### 1. 🤖 Clef-Flash System One AI Decision Engine
888GA introduces sub-200ms edge decision inference powered by Clef-Flash System One with automated 3-tier failover:
- **Primary**: Self-hosted high-speed node (`https://clef.create360.ai/v1/systemone`, <200ms latency, zero external token cost).
- **Fallback 2**: Regional backup node (`https://clef.aiurl.tw/v1/systemone`).
- **Fallback 3**: TypeSafe official failover service (`https://api.typesafe.ai/v1/systemone`).

**Three Intelligent Capabilities**:
- **Site Health Scoring (`site-health`)**: Evaluates overall score (1–5), pinpoints top performance bottlenecks (bounce rate, latency, error rate), and audits traffic authenticity.
- **Incident Anomaly Triage (`anomaly-triage`)**: Categorizes operational urgency from P0 (outage) to Noise, classifying suspect root causes (origin downtime, scraper surges, missing tracking tags, off-peak shifts).
- **Visitor Bot Defense (`bot-defense`)**: Inspects Client Hints, User Agent signatures, and request frequency to prescribe actions (`allow`, `challenge_turnstile`, `block_or_drop`).

### 2. 🔤 Local Zero-Network Typography: JetBrains Mono + Gen Jyuu Gothic
- **Numbers & Code**: Rendered in developer-favorite **JetBrains Mono**.
- **CJK Characters**: Rendered in crisp **Gen Jyuu Gothic (源柔黑體)**.
- **Zero Webfont Overhead**: Removed `@fontsource` and all remote `.woff` / `.woff2` downloads, eliminating Cumulative Layout Shift (CLS) and protecting user privacy from font CDN tracking.
- **13px Stroke Legibility Floor**: Prevents microscopic, illegible glyphs on high-density displays.

### 3. ⚡️ Instant Navigation & Preload Caching
- Eliminates the 280ms exit animation lock.
- Pre-fetches route telemetry upon mouse hover (`intent`), yielding instant 0ms tab transitions.

---

## 🚀 Quick Start

### 1. One-Click Deploy to Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)

**Required Secrets**:
- `MAIN_SECRET`: Random string (> 16 chars) for visitor salting, session tokens, and key derivation.
- `BOOTSTRAP_ADMIN_PASSWORD`: Initial administrator password for account `admin`.

**Optional AI Settings**:
- `CLEF_API_URL`: Primary Clef AI endpoint.
- `CLEF_FALLBACK_URL`: Secondary Clef AI endpoint.
- `TYPESAFE_API_KEY`: TypeSafe API key for tier-3 failover.

### 2. Local Development & Demo Mode

```bash
git clone https://github.com/tbdavid2019/888GA.git
cd 888GA
pnpm install

# Start local demo environment with preloaded mock sites
pnpm run dev:ui
```

Visit `http://localhost:3000` and sign in with `demo` / `demo`.

---

## 📄 License

This project is licensed under the [MIT License](/LICENSE).  
Derived from [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare) (Copyright © 2026 RavelloH).  
888GA branch maintained and evolved by [tbdavid2019](https://github.com/tbdavid2019).
