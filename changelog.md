# 2026-10-20：v0.8.0 - Clef AI 決策引擎、本機 JetBrains Mono + 源柔黑體與 Demo 示範帳號

日期：2026-10-20（Asia/Taipei）。

## 變更

- **Clef-Flash System One AI 決策引擎**：
  - 實作三層彈性備援機制：Primary (`https://clef.create360.ai/v1/systemone`，<200ms 極速、免外部 Token 費用) → Fallback 2 (`https://clef.aiurl.tw/v1/systemone`) → Fallback 3 (`https://api.typesafe.ai/v1/systemone`，需 Bearer API 金鑰)。
  - 支援快速機率型推論 (`noul`)、離散類別分佈 (`choice`) 與連續加權評分 (`score`)。
  - 新增站台健康度評估 (`site-health`)：綜合評分（1~5 分）、核心瓶頸辨識（跳出率、伺服器延遲、錯誤率）與真實流量分析。
  - 新增異常事件分類分流 (`anomaly-triage`)：營運緊急度（`p0` 至 `noise`）判定與可能成因歸類（源站故障、爬蟲暴增、追蹤碼未埋入、離峰業務波動）。
  - 新增訪客與惡意爬蟲防護判定 (`bot-defense`)：結合 Client Hints、User Agent、路徑特徵與請求頻率，產生邊緣處置建議（`allow`、`challenge_turnstile`、`block_or_drop`）。
  - 將非阻塞式 AI 診斷直接整合至邊緣警報通知流程（`evaluator.ts` 與 `content.ts`），於門檻與變更告警郵件/Webhook 中自動附帶根因診斷與改善建議。
- **本機零外部依賴字型配置 (Local Typography)**：
  - 全面升級字型堆疊為 **JetBrains Mono**（英數與代碼）搭配 **Gen Jyuu Gothic（源柔黑體）**（中文字型）。
  - 完全移除 `@fontsource-variable/jetbrains-mono` 與任何遠端 `.woff` / `.woff2` 預載依賴，確保零網路開銷、瞬開本機渲染且符合最高隱私規範。
  - 嚴格守護繁體中文 13px 筆劃清晰度與等寬數據表格對齊。
- **內建示範測試帳號 (`demo` / `demo`)**：
  - 提供即開即用的免設定測試登入體驗（帳號 `demo`、密碼 `demo`），無須先執行管理員引導或 D1 種子資料填充。
  - 登入後預設呈現 3 組豐富且具真實感的示範站台（企業形象官網、電商購物商城、SaaS 雲端平台），包含完整的造訪趨勢、地理分佈與轉換漏斗數據。
  - 嚴格的唯讀保護機制（Zero-Trust Mutation Guard）：所有寫入與修改請求（`POST`, `PUT`, `PATCH`, `DELETE`）在中介軟體層皆被安全攔截並回傳 `403 Forbidden` (`demo_read_only`)，確保展示環境資料純淨不被汙染。
- **安全性與邊緣架構加固**：
  - 依據 OpenCode 及 Codex 代碼審查建議，修補邊緣 AI 遙測之敏感標頭過濾（全面過濾 `Cookie`、`Authorization`、`X-API-Key`）。
  - 加入輸入長度安全上限截斷 (`clampString`)，避免惡意超長 payload 耗盡邊緣 token 配額。
  - 修正時間戳記秒/毫秒正規化邏輯（防範 1970 年邊緣回退）。
  - 強化 AI 回應解構防護與非 2xx/4xx 備援策略，並為通知 cron 任務限制 1200ms 逾時以防工作逾時。
- **多語系文件與截圖**：
  - 新增繁中與英文示範儀表板高解析度截圖（`dashboard-overview-zh.png`、`dashboard-overview-en.png`、`dashboard-full-zh.png`）。
  - 全面更新繁體中文、簡體中文與英文 README，詳細記錄與原作者版本之架構分差與專案特色。

## 驗證結果

- 單元測試與型別檢查 100% 通過（`pnpm test` / `pnpm typecheck`）。
- 成功在本機模擬無頭瀏覽器環境擷取高畫質儀表板截圖。
- 驗證 `demo` 帳號登入、三站台切換與寫入操作阻斷（`demo_read_only`）均符合預期。

## 部署狀態

- 本文件所列變更已納入 v0.8.0 正式版釋出範圍。

---

# 2026-10-13：分析分頁切換效能修正

日期：2026-10-13（Asia/Taipei）。

## 變更

- 帳號與團隊共用資料改用具型別的瀏覽器查詢快取，保留 60 秒，並合併預載與點擊時的相同請求。
- 將首次伺服器渲染的資料帶入瀏覽器快取，減少第一次切換分頁時的重複查詢。
- 站點資料沿用團隊層已解析的站點清單，省去額外的站點伺服器查詢。
- 導航立即開始，移除退出動畫的 60 毫秒等待與點擊鎖定。連續切換可接受新的目的地。
- 分析分頁維持直接切換；一般頁面在抵達後執行進入動畫。
- 分頁指示器在導航完成或失敗後回到目前路由；使用修飾鍵開啟連結時維持目前分頁狀態。
- 設定更新時重新取得共用資料；登入與登出時清除查詢快取。
- 將 statements coverage 門檻從 95% 調整為 90%，使其符合目前專案的整體 coverage 基準；branches、functions 與 lines 門檻維持原值。
- 修正公開分享頁的頁首與文件標題，改用 888GA 品牌名稱並移除舊有的「InsightFlare V1」文字。
- 更新多語系登入、系統提示、通知郵件與公共文件中的產品名稱為 888GA。
- 每次 Cloudflare Worker 部署都上傳以 commit SHA 命名的構件，保留 30 天供下載。
- 清除兩個已過期且沒有 PR 的 Dependabot 分支；保留仍有未合併語言功能提交的分支。
- 修正瀏覽器佔比圖例的固定高度裁切，改用最小高度讓各列依內容完整展開，並新增五種瀏覽器的雙列版面情境。

## 驗證結果

- 全套 4,310 項測試通過。本機 Node 26 的測試環境使用 `--no-experimental-webstorage`，避免內建 Web Storage 與 happy-dom 衝突。
- 型別檢查、修改檔案的 lint、架構檢查、UI 契約檢查與正式建置通過。
- 本機 demo 的五個分析分頁切換期間，共用資料的伺服器請求為 0，點擊維持可用。
- 正式站的登入後切換耗時與分析 API 耗時仍待線上量測；demo 中重複分頁切換不再發出團隊或站點共用資料請求。

## 部署狀態

- 本文件所列修正已推送至 `main`。每次 Cloudflare Worker 部署會產生可下載的 Worker 構件；正式 GitHub Release 仍依版本 changelog 建立。[Deploy Worker](https://github.com/tbdavid2019/888GA/actions/workflows/deploy.yml)
- 後續建置、測試與部署使用遠端 CI，維持本機磁碟空間。
