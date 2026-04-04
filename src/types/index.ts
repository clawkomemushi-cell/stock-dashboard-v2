// ============================================================
// Core Enums & Primitives
// ============================================================

export type MarketStatus =
  | 'pre_market'
  | 'opening'
  | 'intraday'
  | 'closing'
  | 'closed'
  | 'holiday'

export type DirectionBias = 'bullish' | 'bearish' | 'neutral'

export type RiskLevel = 1 | 2 | 3 | 4 | 5

export type ChangeType =
  | 'direction_flip'
  | 'confidence_adjust'
  | 'target_update'
  | 'risk_update'
  | 'no_change'

export type TradeDirection = 'long' | 'short' | 'watch' | 'avoid'

export type Verdict = 'correct' | 'incorrect' | 'partial' | 'pending'

export type DataStatus = 'success' | 'partial' | 'failed'

export type SourceFreshness = 'fresh' | 'stale' | 'unknown'

// data_type drives freshness policy; OpenClaw sets this, frontend reads it
export type DataType =
  | 'preopen'       // daily_thesis / action_plan (preopen draft)
  | 'intraday'      // thesis_check, action_plan (intraday version)
  | 'close'         // close_review, action_plan (post-close version)
  | 'weekly'        // weekly_review
  | 'performance'   // performance_history
  | 'index'         // latest.json itself
  | 'collection'    // collection-layer artifacts (not yet rendered directly)

// ============================================================
// DataMeta — shared _meta block on every JSON file
// ============================================================

export interface DataMeta {
  schema_version: string            // "1.1"
  job_name: string                  // "openclaw.daily_thesis"
  data_type: DataType
  status: DataStatus
  generated_at_iso: string          // ISO 8601, machine use
  generated_at_label: string        // "04/03 07:28", display use
  last_successful_run: string       // ISO 8601
  source_freshness: SourceFreshness // set by OpenClaw, not computed by frontend
  warnings: string[]                // empty = no warnings
  fallback_used: boolean            // true = serving previous run's data
  fallback_source?: string          // path to fallback file if fallback_used
}

// ============================================================
// latest.json — single entry point, OpenClaw updates after every run
// ============================================================

export interface FileStatusEntry {
  status: DataStatus
  updated_at_iso: string
  updated_at_label: string
}

export interface LatestIndex {
  _meta: DataMeta
  date: string                      // "2026-04-04"
  week: string                      // "2026-W14"
  market_status: MarketStatus

  // All page data paths — frontend never constructs paths itself
  paths: {
    daily_thesis: string | null
    action_plan: string | null
    thesis_check: string | null
    close_review: string | null
    weekly_review: string | null    // current week
    performance_history: string | null
  }

  // Per-file health snapshot written by OpenClaw after each job
  file_statuses: {
    daily_thesis: FileStatusEntry
    action_plan: FileStatusEntry
    thesis_check: FileStatusEntry
    close_review: FileStatusEntry
    weekly_review: FileStatusEntry
    performance_history: FileStatusEntry
  }

  // History navigation
  available_weeks: string[]
  available_dates: string[]

  // Week → path map for week selector (no frontend path construction)
  weekly_paths: Record<string, string>

  // Optional publish-layer artifacts (frontend may or may not consume directly yet)
  published_views?: {
    dashboard_summary?: string | null
    morning_view?: string | null
  }
  publish_notes?: string[]
}

// ============================================================
// publish-layer views
// ============================================================

export interface DashboardSummaryView {
  _meta: DataMeta
  date: string
  headline: string
  core_thesis_short: string
  direction_bias: DirectionBias
  risk_level: RiskLevel
  confidence: number
  trading_style: string
  action_plan_version: number | null
  overall_stance: string
  watchlist_count: number
  action_count: number
  notes: string[]
}

export interface MorningView {
  _meta: DataMeta
  date: string
  page: 'morning'
  headline: string
  hero: {
    direction_bias: DirectionBias
    trading_style: string
    confidence: number
    risk_level: RiskLevel
  }
  sections: {
    core_thesis: string
    market_context: DailyThesis['market_context']
    key_risks: string[]
    support_levels: SupportResistanceLevel[]
    resistance_levels: SupportResistanceLevel[]
    watchlist: WatchlistItem[]
    prohibitions: string[]
    cautions: string[]
    notes: string
  }
  notes: string[]
}

// ============================================================
// daily_thesis.json
// ============================================================

export interface SupportResistanceLevel {
  price: number
  label: string
  strength: 'strong' | 'medium' | 'weak'
}

export interface WatchlistItem {
  ticker: string
  name: string
  direction: TradeDirection
  entry_condition: string
  stop_loss_value: number | null    // raw, null = N/A
  stop_loss_label: string           // display
  take_profit_value: number | null
  take_profit_label: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

export interface DailyThesis {
  _meta: DataMeta
  date: string
  generated_at_iso: string
  generated_at_label: string
  market_status: MarketStatus
  risk_level: RiskLevel
  direction_bias: DirectionBias
  confidence: number                // 0.0 – 1.0
  headline: string
  core_thesis: string               // 2–4 sentences, full version
  core_thesis_short: string         // 1–2 sentences, for Dashboard quick view
  market_context: {
    index_trend: string
    volume_status: string
    foreign_capital: string
    institutional_summary: string
  }
  key_risks: string[]
  support_levels: SupportResistanceLevel[]
  resistance_levels: SupportResistanceLevel[]
  watchlist: WatchlistItem[]
  prohibitions: string[]
  cautions: string[]
  trading_style: string
  notes: string
}

// ============================================================
// action_plan.json
// ============================================================

export interface ActionItem {
  ticker: string
  name: string
  direction: TradeDirection
  action: string

  // Dual-layer: raw value (null = not set / N/A) + display label
  price_target_value: number | null
  price_target_label: string
  stop_loss_value: number | null
  stop_loss_label: string
  take_profit_value: number | null
  take_profit_label: string
  position_size_pct: number | null  // 15 means 15%
  position_size_label: string       // "試單 15%"

  rationale: string
  conditions: string[]
  status: 'active' | 'executed' | 'cancelled' | 'expired'
}

export interface PaperTradePosition {
  ticker: string
  name: string
  direction: TradeDirection
  entry_price: number
  current_price: number
  quantity: number
  pnl: number
  pnl_pct: number
  entry_date: string
  status: 'open' | 'closed'
}

export interface PaperTradeSummary {
  virtual_capital: number
  available_cash: number
  today_pnl: number
  today_pnl_pct: number
  total_pnl: number
  total_pnl_pct: number
  win_rate: number
  open_positions: PaperTradePosition[]
}

export interface ActionPlan {
  _meta: DataMeta
  date: string
  generated_at_iso: string
  generated_at_label: string
  version: number
  overall_stance: string
  actions: ActionItem[]
  paper_trade: PaperTradeSummary
  max_exposure_pct: number | null   // raw
  max_exposure_label: string        // "25%（今日保守設定）"
  notes: string
}

// ============================================================
// thesis_check.json — intraday corrections (append-only array)
// ============================================================

export interface ThesisCheckEntry {
  id: string
  timestamp: string
  trigger: string
  original_thesis: string
  revised_thesis: string
  change_type: ChangeType
  risk_level_change: number | null
  confidence_change: number | null
  updated_direction: DirectionBias | null
  updated_actions: Partial<ActionItem>[]
  market_snapshot: {
    taiex_level: number
    taiex_change_pct: number
    volume_ratio: number
  }
  notes: string
}

// thesis_check.json is an array wrapped in an object to carry _meta
export interface ThesisCheckDoc {
  _meta: DataMeta
  entries: ThesisCheckEntry[]
}

// ============================================================
// close_review.json
// ============================================================

export interface TickerResult {
  ticker: string
  name: string
  predicted_direction: TradeDirection
  actual_direction: 'up' | 'down' | 'flat'
  change_pct: number
  verdict: Verdict
  paper_trade_result: number | null
  notes: string
}

export interface CloseReview {
  _meta: DataMeta
  date: string
  generated_at_iso: string
  generated_at_label: string
  taiex_close: number
  taiex_change: number
  taiex_change_pct: number
  taiex_volume: number
  predicted_direction: DirectionBias
  predicted_confidence: number
  actual_direction: 'up' | 'down' | 'flat'
  direction_verdict: Verdict
  thesis_accuracy_score: number
  ticker_results: TickerResult[]
  what_worked: string[]
  what_failed: string[]
  key_learning: string
  bias_observed: string[]
  tomorrow_watchpoints: string[]
  paper_trade_today_pnl: number
}

// ============================================================
// weekly_review.json
// ============================================================

export interface DayBrief {
  date: string
  direction_verdict: Verdict
  thesis_score: number
  taiex_change_pct: number
  paper_trade_pnl: number
  key_event: string
}

export interface WeeklyReview {
  _meta: DataMeta
  week: string
  date_range: string
  generated_at_iso: string
  generated_at_label: string
  days: DayBrief[]
  weekly_stats: {
    direction_accuracy: number
    avg_thesis_score: number
    total_paper_pnl: number
    win_days: number
    total_days: number
    taiex_weekly_change_pct: number
  }
  market_character: string
  system_biases: string[]
  strategy_adjustments: string[]
  notable_calls: {
    best: string
    worst: string
  }
  notes: string
}

// ============================================================
// performance/history.json
// ============================================================

export interface DailyPerformanceRecord {
  date: string
  direction_verdict: Verdict
  thesis_score: number
  confidence: number
  paper_trade_pnl: number
  risk_level: RiskLevel
  market_status_type: string
}

export interface BiasAnalysis {
  bull_bias_rate: number
  bear_bias_rate: number
  overconfidence_rate: number
  morning_vs_intraday_flip_rate: number
}

export interface PerformanceHistory {
  _meta: DataMeta
  generated_at_iso: string
  generated_at_label: string
  total_records: number
  records: DailyPerformanceRecord[]
  summary: {
    overall_win_rate: number
    direction_accuracy: number
    avg_thesis_score: number
    avg_confidence: number
    total_paper_pnl: number
    paper_win_rate: number
  }
  bias_analysis: BiasAnalysis
  monthly_stats: {
    month: string
    win_rate: number
    avg_score: number
    total_pnl: number
    trade_days: number
  }[]
}

// ============================================================
// DataHealth — runtime state tracked by useDataLoader
// ============================================================

export interface FileHealth {
  key: string                       // "daily_thesis"
  label: string                     // "盤前分析"
  path: string | null               // actual URL fetched
  fetchStatus: 'idle' | 'loading' | 'ok' | 'error'
  fetchError: string | null
  meta: DataMeta | null             // from _meta of loaded JSON
  isFallback: boolean
}

export interface ActivePageContext {
  label: string
  fileKey: string                   // key in FileHealth[]
}
