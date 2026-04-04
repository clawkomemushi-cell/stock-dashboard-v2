import { Link } from 'react-router-dom'
import { DirectionBadge, RiskLevelBadge } from '../components/ui/Badge'
import { RiskLevelMeter } from '../components/ui/RiskLevelMeter'
import { ConfidenceBar } from '../components/ui/ConfidenceBar'
import { DataHealthPanel } from '../components/ui/DataHealthPanel'
import { LoadingSpinner, EmptyState } from '../components/ui/LoadingSpinner'
import type { DailyThesis, ActionPlan, ThesisCheckDoc, FileHealth } from '../types'

interface Props {
  thesis: DailyThesis | null
  actionPlan: ActionPlan | null
  thesisCheck: ThesisCheckDoc | null
  loading: boolean
  error?: string | null
  healthMap?: Record<string, FileHealth>
}

function PnlChip({ value, pct }: { value: number; pct: number }) {
  const pos = value >= 0
  return (
    <span className={`font-mono font-semibold ${pos ? 'text-bull' : 'text-bear'}`}>
      {pos ? '+' : ''}{value.toLocaleString()}
      <span className="text-xs ml-1 opacity-75">({pos ? '+' : ''}{pct.toFixed(2)}%)</span>
    </span>
  )
}

export function Dashboard({ thesis, actionPlan, thesisCheck, loading, error, healthMap = {} }: Props) {
  if (loading) return <LoadingSpinner message="載入今日分析資料..." />

  return (
    <div className="space-y-4">
      {/* Page title */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">今日總覽</h1>
          {thesis && (
            <p className="text-sm text-text-muted mt-0.5">
              {thesis.date} · 盤前 {thesis.generated_at_label} 發布
              {actionPlan && ` · 操作計畫 v${actionPlan.version}`}
            </p>
          )}
        </div>
      </div>

      {/* Data health (compact, always shown on dashboard) */}
      <DataHealthPanel
        latest={null}
        latestError={error ?? null}
        healthMap={healthMap}
        activePage={{ label: '今日總覽', fileKey: 'daily_thesis' }}
        defaultOpen={false}
      />

      {/* Graceful: no data yet */}
      {!thesis && !loading && (
        <EmptyState message={error ?? '今日分析資料尚未發布，請稍後再試。'} />
      )}

      {thesis && (
        <>
          {/* ── 核心判斷 ── */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <DirectionBadge direction={thesis.direction_bias} size="lg" />
              <RiskLevelBadge level={thesis.risk_level} />
              <span className="text-xs text-text-muted border border-border rounded px-2 py-0.5">
                {thesis.trading_style}
              </span>
              <span className="text-xs text-text-muted font-mono ml-auto">
                {thesis.generated_at_label}
              </span>
            </div>

            <h2 className="text-base md:text-lg font-semibold text-text-primary leading-snug">
              {thesis.headline}
            </h2>

            {/* Short thesis only — full version is on Morning page */}
            <p className="text-sm text-text-secondary leading-relaxed">
              {thesis.core_thesis_short}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <RiskLevelMeter level={thesis.risk_level} />
              <ConfidenceBar value={thesis.confidence} />
            </div>
          </div>

          {/* ── 禁止事項（條列，不含 cautions，那在 Morning 頁） ── */}
          <div className="card border-l-4 border-l-danger p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="section-title text-danger">今日禁止事項</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {thesis.prohibitions.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="shrink-0 w-4 h-4 rounded bg-danger/15 text-danger text-[10px] font-bold font-mono flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 紙上交易 mini ── */}
          {actionPlan && (
            <div className="card p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="section-title">紙上交易</p>
                <span className="text-xs text-text-muted font-mono">
                  勝率 {Math.round(actionPlan.paper_trade.win_rate * 100)}% ·
                  持倉 {actionPlan.paper_trade.open_positions.length} 筆
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-bg-base rounded-md p-3 border border-border">
                  <p className="label mb-1">今日損益</p>
                  <PnlChip value={actionPlan.paper_trade.today_pnl} pct={actionPlan.paper_trade.today_pnl_pct} />
                </div>
                <div className="bg-bg-base rounded-md p-3 border border-border">
                  <p className="label mb-1">累積損益</p>
                  <PnlChip value={actionPlan.paper_trade.total_pnl} pct={actionPlan.paper_trade.total_pnl_pct} />
                </div>
                <div className="bg-bg-base rounded-md p-3 border border-border col-span-2">
                  <p className="label mb-1">最大曝險</p>
                  <span className="text-sm font-mono text-text-secondary">{actionPlan.max_exposure_label}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 最新盤中狀態 ── */}
          {thesisCheck && thesisCheck.entries.length > 0 && (() => {
            const latest = thesisCheck.entries[thesisCheck.entries.length - 1]
            return (
              <div className="card p-4 border-l-4 border-l-accent">
                <div className="flex items-center gap-2 mb-2">
                  <p className="section-title">最新盤中修正</p>
                  <span className="text-xs font-mono text-text-muted">{latest.timestamp}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono ml-auto ${
                    latest.change_type === 'direction_flip' ? 'border-danger/30 text-danger bg-danger/10' :
                    latest.change_type === 'no_change'      ? 'border-bull/30 text-bull bg-bull/10' :
                    'border-warning/30 text-warning bg-warning/10'
                  }`}>
                    {latest.change_type === 'direction_flip' ? '方向翻轉' :
                     latest.change_type === 'no_change'      ? '維持不變' :
                     latest.change_type === 'risk_update'    ? '風險調整' : '信心調整'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{latest.revised_thesis}</p>
                <div className="flex items-center gap-4 mt-2 font-mono text-xs">
                  <span className="text-text-primary font-semibold">{latest.market_snapshot.taiex_level.toLocaleString()}</span>
                  <span className={latest.market_snapshot.taiex_change_pct < 0 ? 'text-bear' : 'text-bull'}>
                    {latest.market_snapshot.taiex_change_pct > 0 ? '+' : ''}{latest.market_snapshot.taiex_change_pct.toFixed(2)}%
                  </span>
                  <span className="text-text-muted">量比 {latest.market_snapshot.volume_ratio.toFixed(2)}x</span>
                  <span className="text-text-muted ml-auto">
                    共 {thesisCheck.entries.length} 次修正 →
                    <Link to="/intraday" className="text-accent ml-1 hover:underline">查看 Timeline</Link>
                  </span>
                </div>
              </div>
            )
          })()}

          {/* ── 觀察標的 mini（代號+方向+優先度，完整表格在 Morning） ── */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <p className="section-title">觀察標的</p>
              <Link to="/morning" className="text-xs text-accent hover:underline font-mono">完整分析 →</Link>
            </div>
            <div className="divide-y divide-border/50">
              {thesis.watchlist.map((item) => (
                <div key={item.ticker} className="px-5 py-2.5 flex items-center gap-3">
                  <span className="font-mono font-semibold text-text-primary w-16">{item.ticker}</span>
                  <span className="text-sm text-text-secondary flex-1">{item.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                    item.direction === 'long'  ? 'border-bull/30 text-bull bg-bull/10' :
                    item.direction === 'short' ? 'border-bear/30 text-bear bg-bear/10' :
                    item.direction === 'watch' ? 'border-warning/30 text-warning bg-warning/10' :
                    'border-border text-text-muted'
                  }`}>
                    {item.direction === 'long' ? '做多' : item.direction === 'short' ? '放空' :
                     item.direction === 'watch' ? '觀察' : '迴避'}
                  </span>
                  <span className={`text-xs w-12 text-right ${
                    item.priority === 'high' ? 'text-danger' :
                    item.priority === 'medium' ? 'text-warning' : 'text-text-muted'
                  }`}>
                    {item.priority === 'high' ? '★★★' : item.priority === 'medium' ? '★★' : '★'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
