# 888GA

> 次世代 Cloudflare 繁體中文自託管網站數據分析平台 (Next-Gen Cloudflare Web Analytics)  
> 隱私優先、無 Cookie、極速響應、專為繁體中文環境與個人站長深度定製。

<!-- auto-readme-i18n-switcher start -->
| [English](/.github/readme/README.en.md) | [日本語](/.github/readme/README.ja.md) | 中文（台灣） | [中文](/.github/readme/README.zh.md) |
<!-- auto-readme-i18n-switcher end -->

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](/LICENSE)

---

## 💡 致敬與開源傳承 (Acknowledgments & Heritage)

**888GA** Fork 自優質開源專案 [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare)。

在此由衷感謝原作者 **RavelloH** 的出色開創、前瞻性邊緣無伺服器架構與開源貢獻！

### 為什麼要有 888GA 獨立分支？
原作者專案具備優秀的 Cloudflare 邊緣架構，但其產品設計偏向「密實微型英文排版」與「多層級 SaaS 團隊管理」，在繁體中文用戶與個人站長情境下存在諸多痛點。

**888GA** 為長期獨立維護之進階定製分支，重點帶來以下革新：

1. **🇹🇼 繁體中文工藝級排版尺度 (Refined CJK Typography)**
   - 徹底終結 10~11px 微型字體在繁體中文下筆劃擠壓、模糊不清的閱讀痛點。
   - 建立標準 16px 基準與繁中舒適階梯尺度（13px ~ 16px），並精準保護熱力圖與等寬數據表格。
2. **⚡️ 零延遲極速導航 (Zero Artificial Delay & Smart Preloading)**
   - 移除原版每次頁面切換強制等待 280ms 退出動畫的人工延遲。
   - 啟用 TanStack Router `intent` 預載機制與記憶體快取（30s~60s），滑鼠懸停即預先抓取資料，點擊達到零延遲瞬開體驗。
3. **🎯 站長直覺化管理流程 (Webmaster-First UX)**
   - 新增站台管理「一鍵查看 HTML 追蹤代碼」對話框與完整 3 步驟安裝指引。
   - 簡化個人多站點切換與數據直達流程，大幅降低操作路徑。
4. **🌐 繁體中文在地化與通知系統**
   - 深度補全繁體中文 (zh-TW) 語系。
   - 支援 Telegram、Email 等警報通知的繁中在地化呈現。
5. **🛡 純淨品牌與外觀**
   - 採用全新 **888GA** 品牌識別，移除多餘的裝飾標籤，介面洗鍊清爽。

---

## 🌟 核心特色

- **100% 雲原生邊緣運算**：完全運行在 Cloudflare Workers、Cloudflare D1 與 Analytics Engine 上，無需購買 VPS。
- **免 Cookie 隱私友善**：全面符合 GDPR / CCPA 規範，無需彈出令人反感的 Cookie 同意橫幅。
- **超輕量 SDK**：前端追蹤 JavaScript 經 Gzip 壓縮後僅約 3 KB，透過 Cloudflare 全球 CDN 快取，對網站加載速度幾乎零負擔。
- **免費配額極大化**：充分利用 Cloudflare Free 方案，每日可免費支援多達 10 萬次頁面造訪與事件追蹤。
- **全方位數據維度**：包含即時訪客監控、造訪路徑、留存率分析、漏斗轉換、自訂事件與地理位置視覺化。

---

## 🚀 快速開始 (Quick Start)

### 方式一：一鍵部署至 Cloudflare

點擊下方按鈕即可一鍵部署至您的 Cloudflare 帳戶：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ftbdavid2019%2F888GA)

部署過程中需填寫以下環境變數：

| 變數名稱 | 用途說明 |
| :--- | :--- |
| `MAIN_SECRET` | 核心加密金鑰（長度大於 16 位的隨機字串，用於訪客隱私加鹽、Session 簽名與 Token 加密） |
| `BOOTSTRAP_ADMIN_PASSWORD` | 初始管理員密碼（帳號預設為 `admin`，登入後可於個人資料修改） |

### 方式二：自訂網域綁定

部署完成後，您可以在 Cloudflare Worker 設定中綁定自己的自訂網域（例如 `flow.aiurl.tw` 或 `analytics.yourdomain.com`）。

---

## 📄 開源授權 (License)

本專案基於 [MIT 授權條款](/LICENSE) 開源釋出。  
衍生自 [RavelloH/InsightFlare](https://github.com/RavelloH/InsightFlare) (Copyright © 2026 RavelloH)。  
888GA 自訂分支由 [tbdavid2019](https://github.com/tbdavid2019) 維護。
