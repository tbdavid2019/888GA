# 888GA

> 次世代 Cloudflare 繁體中文自託管網站數據分析平台 (Next-Gen Cloudflare Web Analytics)  
> 隱私優先、無 Cookie、極速響應，整合 **Clef-Flash System One AI 邊緣決策引擎** 與 **本機源柔黑體工藝級排版**，專為獨立站長與極致效能追求者深度定製。

<!-- auto-readme-i18n-switcher start -->
| [English](/.github/readme/README.en.md) | [日本語](/.github/readme/README.ja.md) | 中文（台灣） | [中文](/.github/readme/README.zh.md) |
<!-- auto-readme-i18n-switcher end -->

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](/LICENSE)
[![Release: v0.8.0](https://img.shields.io/badge/Release-v0.8.0-emerald.svg)](/changelog/v0.8.0.md)

---

## 📸 系統儀表板預覽 (Dashboard Preview)

![888GA 繁體中文儀表板示範資料](/docs/images/dashboard-overview-zh.png)

---

## 🎮 免設定 Demo 示範帳號 (Instant Demo Sandbox)

想要在不修改任何現有資料庫、無須部署雲端資源的情況下體驗 888GA？系統已內建專屬展示帳號：

- **展示帳號**：`demo`
- **展示密碼**：`demo`

### 示範環境特色
- **三大真實感示範站台**：登入即可切換檢視「企業形象官網 (Corporate)」、「電商購物商城 (E-commerce)」以及「SaaS 雲端平台 (SaaS App)」。
- **豐富示範數據**：包含即時造訪人次、訪客國家分佈地圖、各作業系統與瀏覽器佔比、轉換漏斗與跳出率趨勢。
- **零信任唯讀保護 (Zero-Trust Mutation Guard)**：所有寫入與設定修改請求（`POST`, `PUT`, `PATCH`, `DELETE`）在邊緣中介層皆會被安全攔截並回傳 `403 Forbidden` (`demo_read_only`)，確保展示環境始終純淨不被更動。

---

## 💡 致敬與開源傳承 (Acknowledgments & Heritage)

**888GA** 是基於優秀開源專案 [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare) 發展的獨立進階定製分支。

在此向原作者 **RavelloH** 在邊緣運算與輕量化分析領域的前瞻性貢獻致上崇高敬意！

---

## ⚡️ 888GA 與原作者版本（InsightFlare）的深度分差

雖然延續了 Cloudflare Workers 邊緣運算的核心優勢，但 888GA 針對原版在「字體視覺痛點」、「導航卡頓延遲」、「缺乏智慧診斷」與「缺乏開箱即用展示」等關鍵層面進行了徹底重構與升級：

| 評比維度 | 原版 InsightFlare | 888GA 進階分支 (v0.8.0) |
| :--- | :--- | :--- |
| **AI 決策與診斷** | ❌ 無（僅靜態資料庫指標統計） | ✅ **Clef-Flash System One 決策引擎**（<200ms 極速診斷、自動根因分類、健康評分、爬蟲防禦） |
| **排版與字型堆疊** | 依賴遠端 `.woff` 下載；大量 10~11px 微型字體，中文環境筆劃擠壓模糊 | ✅ **純本機零依賴**：JetBrains Mono（英數代碼）+ 源柔黑體（Gen Jyuu Gothic），無網路請求、防護 13px 清晰底線 |
| **頁面導航體驗** | 強制等待 280ms 退出動畫，點擊有延遲感 | ✅ **零人工延遲**：移除多餘等待，啟用 TanStack Router `intent` 預載與記憶體快取（30s~60s），滑鼠滑過預取，點擊 0ms 瞬開 |
| **展示與評估** | 需仰賴作者外部展示站，無內建免安裝 Demo 帳號 | ✅ **內建 `demo`/`demo` 唯讀沙盒**，預載 3 組站台完整數據，邊緣安全中介層阻斷寫入 |
| **告警通知加值** | 僅發送單純數值超標文字通知 | ✅ **AI 智慧通知**：告警郵件/Webhook 自動附帶 Clef AI 根因推論分析與改善建議指引 |
| **獨立站長 UX** | 偏向複雜的多層級 SaaS 團隊管理流程 | ✅ **站長第一優先**：一鍵開啟 HTML 追蹤碼彈窗與 3 步驟快速指引、直覺的多站切換切換面板 |
| **語言與在地化** | 簡中為主，繁中語系缺漏不全 | ✅ **完整繁體中文 (zh-TW)** 第一等公民支援，涵蓋設定、圖表、工具提示與系統告警 |
| **邊緣安全防禦** | 基礎傳輸 | ✅ **敏感標頭過濾**（Cookie/Auth 自動脫敏）、輸入長度截斷保護、時戳回退校驗 |

---

## 🌟 核心革新功能解析

### 1. 🤖 Clef-Flash System One AI 決策引擎
888GA 首度在邊緣分析系統中導入超輕量、低延遲（<200ms）的 System One 決策推論機制，並建立堅實的三層備援容災線路：
- **Primary 節點**：自建極速節點（免外部 Token 計費，延遲小於 200ms）。
- **Fallback 2 節點**：自建跨區域備援節點。
- **Fallback 3 節點**：TypeSafe 官方高可用服務。

**三大核心 AI 決策能力**：
- **站台健康評估 (`site-health`)**：自動分析跳出率、伺服器響應時間、錯誤率與造訪真實度，輸出 1~5 星健康評級與改善重點。
- **異常事件分流 (`anomaly-triage`)**：流量突增或驟降時，自動定級緊急程度（P0 致命 ～ Noise 雜訊），並識別可能成因（源站伺服器宕機、惡意爬蟲大量掃描、前端追蹤碼失效、常態離峰波動）。
- **邊緣訪客與爬蟲防禦 (`bot-defense`)**：綜合評估請求特徵、Client Hints 與行為頻率，向 Cloudflare 邊緣建議處理策略（`allow`、`challenge_turnstile`、`block_or_drop`）。

### 2. 🔤 本機零網路依賴字型：JetBrains Mono + 源柔黑體
原版在繁體中文使用者電腦上常出現筆劃黏在一起、難以辨識的困境。888GA 特別打造了頂級中英工藝排版：
- **英數與數字**：採用最具工程美感的 **JetBrains Mono**。
- **中文與介面**：採用圓潤柔和、極度清晰的 **Gen Jyuu Gothic（源柔黑體）**。
- **完全零外部網路請求**：拔除 `@fontsource` 與所有遠端 `.woff` / `.woff2` 預載鏈，徹底杜絕字體引發的頁面佈局位移 (CLS) 與網路延遲，更有效保障訪客隱私不向字型 CDN 外流。
- **13px 筆劃清晰度防護底線**：重整階梯尺度，確保任何密集指標與表格數據均能舒暢閱讀。

### 3. ⚡️ 零延遲 SPA 導航與 TanStack Router 預載
徹底揮別原版 280ms 的沉重等待！888GA 導入現代 Web 效能標準：
- 在滑鼠 Hover 導航項目的微秒間（`intent`），自動預先發送資料查詢請求。
- 記憶體快取層自動合併重複請求，讓常用切換達到真正的 0ms 順暢切換。

---

## 🚀 快速開始 (Quick Start)

### 方式一：一鍵部署至 Cloudflare Workers

點擊下方按鈕即可一鍵部署至您自己的 Cloudflare 帳戶：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)

部署過程中需填寫以下環境變數：

| 變數名稱 | 必要性 | 用途說明 |
| :--- | :---: | :--- |
| `MAIN_SECRET` | **必填** | 核心加密金鑰（長度大於 16 位的隨機字串，用於訪客隱私加鹽雜湊、Session 簽名與 Token 加密） |
| `BOOTSTRAP_ADMIN_PASSWORD` | **必填** | 初始管理員密碼（帳號預設為 `admin`，登入後可於個人資料修改） |
| `CLEF_API_URL` | 選填 | Clef-Flash AI 主要端點（預設支援 `https://clef.create360.ai/v1/systemone`） |
| `CLEF_FALLBACK_URL` | 選填 | Clef-Flash AI 備援端點（預設支援 `https://clef.aiurl.tw/v1/systemone`） |
| `TYPESAFE_API_KEY` | 選填 | TypeSafe 官方第三層備援金鑰 |

### 方式二：本機開發與測試

```bash
# 1. 複製專案
git clone https://github.com/tbdavid2019/888GA.git
cd 888GA

# 2. 安裝相依套件
pnpm install

# 3. 啟動本機 Demo 展示模式（包含示範資料與 demo/demo 帳號）
pnpm run dev:ui
```

瀏覽器開啟 `http://localhost:3000`，輸入帳號 `demo`、密碼 `demo` 即可立即開始探索！

---

## 📄 開源授權 (License)

本專案基於 [MIT 授權條款](/LICENSE) 開源釋出。  
衍生自 [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare) (Copyright © 2026 RavelloH)。  
888GA 自訂分支由 [tbdavid2019](https://github.com/tbdavid2019) 持續維護與演進。
