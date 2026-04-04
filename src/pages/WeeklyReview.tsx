import { useState } from 'react'
import { VerdictBadge } from '../components/ui/Badge'
import { LoadingSpinner, ErrorDisplay } from '../components/ui/LoadingSpinner'
import { useWeeklyReview } from '../hooks/useDataLoader'
import type { LatestIndex, FileHealth } from '../types'

interface Props {
  latest: LatestIndex | null
  healthMap: Record<string, FileHealth>
}

function WeekDayCard({ day }: {
  day: {
    date: string
    direction_verdict: string
    thesis_score: number
    taiex_change_pct: number
    paper_trade_pnl: number
    key_event: string
  }
}) {
  const scoreColor =
    day.thesis_score >= 75 ? 'text-bull' :
    day.thesis_score >= 55 ? 'text-warning' : 'text-bear'
  const weekdayName = (() => {
    try { return new Date(day.date).toLocaleDateString('zh-TW', { weekday: 'short' }) }
    catch { return '' }
  })()
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted font-mono">{day.date}</p>
          <p className="text-sm font-semibold text-text-secondary">{weekdayName}</p>
        </div>
        <VerdictBadge verdict={day.direction_verdict as 'correct' | 'incorrect' | 'partial' | 'pending'} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="label">準確分</p>
          <p className={`text-lg font-bold font-mono ${scoreColor}`}>{day.thesis_score}</p>
        </div>
        <div>
          <p className="label">大盤</p>
          <p className={`text-sm font-mono font-semibold ${day.taiex_change_pct < 0 ? 'text-bear' : 'text-bull'}`}>
            {day.taiex_change_pct > 0 ? '+' : ''}{day.taiex_change_pct.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="label">損益</p>
          <p className={`text-sm font-mono font-semibold ${day.paper_trade_pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
            {day.paper_trade_pnl >= 0 ? '+' : ''}{(day.paper_trade_pnl / 1000).toFixed(1)}K
          </p>
        </div>
      </div>
      <p className="text-xs text-text-muted leading-snug">{day.key_event}</p>
    </div>
  )
}

export function WeeklyReview({ latest }: Props) {
  const [selectedWeek, setSelectedWeek] = useState<string>(latest?.week ?? '')
  // Path comes entirely from latest.weekly_paths — no manual construction
  const { data: review, loading, error } = useWeeklyReview(
    selectedWeek || latest?.week || null,
    latest?.weekly_paths,
  )
  const availableWeeks = latest?.available_weeks ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">週回顧</h1>
          {review && <p className="text-sm text-text-muted mt-0.5">{review.date_range}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="label">選週</span>
          <select
            value={selectedWeek || latest?.week}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-bg-card border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {availableWeeks.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner message="載入週回顧..." />}
      {error && <ErrorDisplay message={error} />}

      {review && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: '方向準確率', value: `${Math.round(review.weekly_stats.direction_accuracy * 100)}%`, color: review.weekly_stats.direction_accuracy >= 0.6 ? 'text-bull' : 'text-bear' },
              { label: '平均準確分', value: review.weekly_stats.avg_thesis_score.toFixed(1), color: review.weekly_stats.avg_thesis_score >= 65 ? 'text-bull' : 'text-bear' },
              { label: '勝負天數', value: `${review.weekly_stats.win_days}/${review.weekly_stats.total_days}`, color: 'text-text-primary' },
              { label: '大盤週漲跌', value: `${review.weekly_stats.taiex_weekly_change_pct > 0 ? '+' : ''}${review.weekly_stats.taiex_weekly_change_pct.toFixed(2)}%`, color: review.weekly_stats.taiex_weekly_change_pct < 0 ? 'text-bear' : 'text-bull' },
              { label: '週損益', value: `${review.weekly_stats.total_paper_pnl >= 0 ? '+' : ''}${(review.weekly_stats.total_paper_pnl / 1000).toFixed(1)}K`, color: review.weekly_stats.total_paper_pnl >= 0 ? 'text-bull' : 'text-bear' },
              { label: '市場特性', value: review.market_character, color: 'text-accent' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-3">
                <p className="label mb-1.5">{label}</p>
                <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="label mb-3">每日明細</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {review.days.map((day) => <WeekDayCard key={day.date} day={day} />)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 border-l-4 border-l-bull">
              <p className="label mb-2 text-bull">本週最佳判斷</p>
              <p className="text-sm text-text-secondary leading-relaxed">{review.notable_calls.best}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-bear">
              <p className="label mb-2 text-bear">本週最差判斷</p>
              <p className="text-sm text-text-secondary leading-relaxed">{review.notable_calls.worst}</p>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-title mb-4">本週系統性偏誤</p>
            <ul className="space-y-2">
              {review.system_biases.map((bias, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="shrink-0 w-5 h-5 rounded bg-warning/15 text-warning text-[10px] font-bold font-mono flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{bias}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5 border border-accent/20">
            <p className="section-title mb-4 text-accent">下週策略調整</p>
            <ul className="space-y-2">
              {review.strategy_adjustments.map((adj, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="text-accent shrink-0">→</span>
                  <span>{adj}</span>
                </li>
              ))}
            </ul>
          </div>

          {review.notes && (
            <div className="card p-4">
              <p className="label mb-2">本週備註</p>
              <p className="text-sm text-text-muted italic">{review.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
