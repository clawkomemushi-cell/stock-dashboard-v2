# 台股分析助手 v2 — OpenClaw 交接文件

> 最後更新：2026-04-04
> 版本：v2（schema 1.1，雙層欄位 + _meta）

---

## 一、系統定位

| 角色 | 職責 |
|---|---|
| **OpenClaw** | 定時寫入 JSON 資料到 `public/data/` |
| **前端（本專案）** | 唯讀，fetch JSON，渲染畫面 |

前端**不計算、不預測、不構造路徑**。所有路徑皆來自 `latest.json`。

---

## 二、安裝與啟動

```bash
# 安裝依賴（需要 Node.js 18+）
npm install

# 開發伺服器
npm run dev          # http://localhost:5173

# 生產 build
npm run build        # 輸出 dist/
```

---

## 三、資料夾結構

```
stock-dashboard-v2-handoff/
├── src/
│   ├── App.tsx                   # 路由 + 資料協調層
│   ├── main.tsx
│   ├── index.css                 # Tailwind base styles
│   ├── types/index.ts            # 所有 TypeScript 型別（schema 1.1）
│   ├── hooks/
│   │   └── useDataLoader.ts      # fetch 邏輯（no-cache、FileHealth 追蹤）
│   ├── pages/                    # 六個頁面
│   │   ├── Dashboard.tsx
│   │   ├── MorningAnalysis.tsx
│   │   ├── Intraday.tsx
│   │   ├── PaperTrade.tsx
│   │   ├── CloseReview.tsx
│   │   ├── WeeklyReview.tsx
│   │   └── SystemStats.tsx
│   └── components/
│       ├── dashboard/            # Dashboard 專用卡片
│       ├── layout/               # Layout、TopBar、Sidebar
│       └── ui/                   # 通用 UI（Badge、DataHealthPanel…）
├── public/
│   └── data/                     # OpenClaw 寫入區域（見下節）
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

---

## 四、OpenClaw 資料寫入規範

### 4-1 唯一入口：`public/data/latest.json`

OpenClaw 每次 job 結束後必須更新此檔。前端以此為起點拿所有路徑。

```json
{
  "_meta": { ... },
  "date": "2026-04-04",
  "week": "2026-W15",
  "market_status": "closed",
  "paths": {
    "daily_thesis":        "/data/daily/2026-04-04/daily_thesis.json",
    "action_plan":         "/data/daily/2026-04-04/action_plan.json",
    "thesis_check":        "/data/daily/2026-04-04/thesis_check.json",
    "close_review":        "/data/daily/2026-04-04/close_review.json",
    "weekly_review":       "/data/weekly/2026-W15/weekly_review.json",
    "performance_history": "/data/performance/history.json"
  },
  "file_statuses": { ... },
  "available_weeks": ["2026-W15"],
  "available_dates": ["2026-04-04"],
  "weekly_paths": {
    "2026-W15": "/data/weekly/2026-W15/weekly_review.json"
  }
}
```

> **重要**：`available_weeks` 和 `weekly_paths` 只能列出**實際存在**的週次檔案。
> 如果某週的 weekly_review.json 尚未產生，不可列入這兩個欄位。

### 4-2 每個 JSON 必須有 `_meta` 區塊

```json
{
  "_meta": {
    "schema_version": "1.1",
    "job_name": "openclaw.daily_thesis",
    "data_type": "preopen",
    "status": "success",
    "generated_at_iso": "2026-04-04T07:28:00+08:00",
    "generated_at_label": "04/04 07:28",
    "last_successful_run": "2026-04-04T07:28:00+08:00",
    "source_freshness": "fresh",
    "warnings": [],
    "fallback_used": false
  },
  ...
}
```

| `data_type` | 對應檔案 |
|---|---|
| `preopen` | daily_thesis |
| `intraday` | thesis_check, action_plan（盤中版） |
| `close` | close_review, action_plan（收盤版） |
| `weekly` | weekly_review |
| `performance` | performance/history.json |
| `index` | latest.json |

### 4-3 雙層欄位規則（v1.1 schema）

數值欄位一律提供 raw 值 + display label：

```json
"stop_loss_value": 185.0,
"stop_loss_label": "185（-3%）",
"take_profit_value": null,
"take_profit_label": "N/A"
```

前端只讀 `_label` 欄位渲染，`_value` 欄位保留給未來邏輯使用。

### 4-4 thesis_check.json 結構（注意）

```json
{
  "_meta": { ... },
  "entries": [ ... ]
}
```

**不是**裸 array，必須包在 `{ _meta, entries }` 物件中。

---

## 五、頁面路由對應

| URL | 頁面 | 資料來源 key |
|---|---|---|
| `/` | Dashboard（每日快覽） | `daily_thesis` + `action_plan` + `thesis_check` |
| `/morning` | 盤前分析 | `daily_thesis` |
| `/intraday` | 盤中修正 Timeline | `thesis_check` |
| `/trade` | 紙上交易 | `action_plan` |
| `/close` | 收盤檢討 | `close_review` |
| `/weekly` | 週回顧 | `weekly_paths[selectedWeek]` |
| `/performance` | 系統績效 | `performance_history` |

---

## 六、本版本修正項目（v2 vs v1）

| 類別 | 修正內容 |
|---|---|
| TypeScript | 10 個欄位錯誤全數修正（`generated_at` → `_label`、舊 `stop_loss` 等） |
| 資料入口 | 所有 paths 來自 `latest.json`，前端不自行構造日期路徑 |
| 快取 | 所有 fetch 加上 `cache: 'no-store'`，避免讀到舊資料 |
| stale data | URL 變 null 或 fetch 失敗時清除舊資料，不保留前次結果 |
| latest 錯誤 | `latest.json` 讀取失敗時 Dashboard 顯示明確錯誤訊息 |
| DataHealthPanel | performance_history 使用真實 fetch health；weekly 依 file_statuses 推導 |
| PnL 符號 | 累積損益符號與顏色依正負值動態判斷（不再強制顯示綠色+） |
| SPA 導航 | 兩處 `<a href>` 換成 React Router `<Link>`，不再觸發頁面重載 |
| latest.json | 移除不存在的 W11/W12/W13，避免週次選單出現無效選項 |

---

## 七、OpenClaw 接手後需要完成的工作

1. **設定每日自動寫入**：按照第四節規格，讓 job 結束後自動覆寫 `public/data/` 下的對應 JSON
2. **每次執行後更新 latest.json**：特別是 `paths`、`available_weeks`、`weekly_paths`、`file_statuses`
3. **部署 dist/**：執行 `npm run build`，將 `dist/` 部署到靜態伺服器（nginx / GitHub Pages / Cloudflare Pages 等）
4. **確認靜態伺服器的 SPA fallback**：所有 404 路由需 redirect 到 `index.html`，否則直接開 `/morning` 等子路徑會失敗

   nginx 範例：
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

5. **週次累積**：每週結束後，在 `available_weeks` 和 `weekly_paths` 中新增該週，並確認對應 JSON 已存在
6. **mock 資料換成真實資料**：`public/data/` 目前包含 2026-04-03 的 mock 範例，上線前刪除或替換

---

## 八、mock 資料位置（範例用，可刪）

```
public/data/latest.json                              ← 入口
public/data/daily/2026-04-03/*.json                  ← 單日 mock
public/data/weekly/2026-W14/weekly_review.json       ← 週 mock
public/data/performance/history.json                 ← 績效 mock
```
