import { VerdictBadge } from '../components/ui/Badge'
import { LoadingSpinner, ErrorDisplay } from '../components/ui/LoadingSpinner'
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import type { CloseReview as CloseReviewType } from '../types'

interface Props {
  review: CloseReviewType | null
  loading: boolean
  error?: string | null
}

export function CloseReview({ review, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入收盤檢討..." />
  if (error) return <ErrorDisplay message={error} />
  if (!review) return <ErrorDisplay message="今日收盤檢討尚未發布" />

  const accuracyColor =
    review.thesis_accuracy_score >= 75 ? 'text-bull' :
    review.thesis_accuracy_score >= 55 ? 'text-warning' : 'text-bear'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">收盤檢討</h1>
        <p className="text-sm text-text-muted mt-0.5">{review.date} · 發布時間 {review.generated_at_label}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="label mb-1.5">大盤收盤</p>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {review.taiex_close.toLocaleString()}
          </p>
          <p className={`text-sm font-mono mt-1 ${review.taiex_change < 0 ? 'text-bear' : 'text-bull'}`}>
            {review.taiex_change > 0 ? '+' : ''}{review.taiex_change} ({review.taiex_change_pct.toFixed(2)}%)
          </p>
        </div>
        <div className="card p-4">
          <p className="label mb-1.5">方向預測</p>
          <VerdictBadge verdict={review.direction_verdict} />
          <p className="text-xs text-text-muted mt-2">
            預測 {review.predicted_direction === 'bearish' ? '偏空' : '偏多'} → 實際{review.actual_direction === 'down' ? '下跌' : review.actual_direction === 'up' ? '上漲' : '平盤'}
          </p>
        </div>
        <div className="card p-4">
          <p className="label mb-1.5">論點準確分</p>
          <p className={`text-2xl font-bold font-mono ${accuracyColor}`}>
            {review.thesis_accuracy_score}
          </p>
          <p className="text-xs text-text-muted mt-1">/ 100 分</p>
        </div>
        <div className="card p-4">
          <p className="label mb-1.5">今日紙上交易</p>
          <p className={`text-2xl font-bold font-mono ${review.paper_trade_today_pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
            {review.paper_trade_today_pnl >= 0 ? '+' : ''}{review.paper_trade_today_pnl.toLocaleString()}
          </p>
          <p className="text-xs text-text-muted mt-1">NTD</p>
        </div>
      </div>

      {/* What worked / failed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 border-l-4 border-l-bull">
          <p className="label mb-3 text-bull">做對的事</p>
          <ul className="space-y-2">
            {review.what_worked.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-bull shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4 border-l-4 border-l-bear">
          <p className="label mb-3 text-bear">待改進</p>
          <ul className="space-y-2">
            {review.what_failed.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-bear shrink-0">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key learning */}
      <div className="card p-5 border border-accent/20 bg-accent/5">
        <p className="label mb-2 text-accent">今日關鍵學習</p>
        <p className="text-sm text-text-secondary leading-relaxed">{review.key_learning}</p>
      </div>

      {/* Ticker results table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="section-title">各標的結果</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-base/50">
                <th className="px-4 py-2.5 text-left label">代號</th>
                <th className="px-4 py-2.5 text-left label">名稱</th>
                <th className="px-4 py-2.5 text-left label">預測</th>
                <th className="px-4 py-2.5 text-left label">實際</th>
                <th className="px-4 py-2.5 text-right label">漲跌</th>
                <th className="px-4 py-2.5 text-center label">結果</th>
                <th className="px-4 py-2.5 text-right label hidden sm:table-cell">損益</th>
              </tr>
            </thead>
            <tbody>
              {review.ticker_results.map((r) => (
                <tr key={r.ticker} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-text-primary">{r.ticker}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.name}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{r.predicted_direction}</td>
                  <td className="px-4 py-3">
                    <span className={r.actual_direction === 'up' ? 'text-bull' : r.actual_direction === 'down' ? 'text-bear' : 'text-text-muted'}>
                      {r.actual_direction === 'up' ? '↑ 漲' : r.actual_direction === 'down' ? '↓ 跌' : '→ 平'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-sm ${r.change_pct < 0 ? 'text-bear' : 'text-bull'}`}>
                    {r.change_pct > 0 ? '+' : ''}{r.change_pct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {r.paper_trade_result !== null ? (
                      <span className={`font-mono text-sm ${r.paper_trade_result >= 0 ? 'text-bull' : 'text-bear'}`}>
                        {r.paper_trade_result >= 0 ? '+' : ''}{r.paper_trade_result.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-text-muted text-xs">未操作</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biases observed */}
      {review.bias_observed.length > 0 && (
        <CollapsibleSection title="觀察到的偏誤" defaultOpen>
          <ul className="p-4 space-y-2">
            {review.bias_observed.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-warning shrink-0 mt-0.5">◈</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Tomorrow watchpoints */}
      <CollapsibleSection title="明日關注事項" defaultOpen>
        <ul className="p-4 space-y-2">
          {review.tomorrow_watchpoints.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="text-accent shrink-0">→</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  )
}
