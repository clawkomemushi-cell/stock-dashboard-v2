import { JudgmentTimeline } from '../components/dashboard/JudgmentTimeline'
import { TradeDirectionBadge } from '../components/ui/Badge'
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../components/ui/LoadingSpinner'
import type { ThesisCheckDoc, ActionPlan } from '../types'

interface Props {
  thesisCheck: ThesisCheckDoc | null
  actionPlan: ActionPlan | null
  loading: boolean
  error?: string | null
}

export function Intraday({ thesisCheck, actionPlan, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入盤中追蹤資料..." />
  if (error) return <ErrorDisplay message={error} />

  const entries = thesisCheck?.entries ?? []
  const latestEntry = entries[entries.length - 1]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">盤中追蹤</h1>
        {latestEntry && (
          <p className="text-sm text-text-muted mt-0.5">
            最後更新 {latestEntry.timestamp} · 共 {entries.length} 次修正
          </p>
        )}
      </div>

      {/* Latest market snapshot */}
      {latestEntry && (
        <div className="card p-5">
          <p className="label mb-3">最新市場快照 ({latestEntry.timestamp})</p>
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {latestEntry.market_snapshot.taiex_level.toLocaleString()}
              </p>
              <p className={`text-sm font-mono font-semibold mt-1 ${
                latestEntry.market_snapshot.taiex_change_pct < 0 ? 'text-bear' : 'text-bull'
              }`}>
                {latestEntry.market_snapshot.taiex_change_pct > 0 ? '+' : ''}
                {latestEntry.market_snapshot.taiex_change_pct.toFixed(2)}%
              </p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="label mb-1">量比</p>
              <p className="text-lg font-mono text-text-secondary">
                {typeof latestEntry.market_snapshot.volume_ratio === 'number'
                  ? `${latestEntry.market_snapshot.volume_ratio.toFixed(2)}x`
                  : '—'}
              </p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex-1 min-w-[200px]">
              <p className="label mb-1">當前論點</p>
              <p className="text-sm text-text-secondary leading-snug">{latestEntry.revised_thesis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action plan */}
      {actionPlan && actionPlan.actions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="section-title">操作建議 v{actionPlan.version}</p>
          </div>
          <div className="divide-y divide-border">
            {actionPlan.actions.map((action) => (
              <div key={action.ticker} className="p-4 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-text-primary">{action.ticker}</span>
                  <span className="text-text-secondary text-sm">{action.name}</span>
                  <TradeDirectionBadge direction={action.direction} />
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono ${
                    action.status === 'executed'  ? 'border-bull/30 text-bull bg-bull/10' :
                    action.status === 'cancelled' ? 'border-border text-text-muted bg-border/20' :
                    'border-accent/30 text-accent bg-accent/10'
                  }`}>
                    {action.status === 'executed' ? '已執行' :
                     action.status === 'cancelled' ? '已取消' :
                     action.status === 'expired' ? '已過期' : '進行中'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{action.rationale}</p>
                <div className="flex gap-4 text-xs font-mono flex-wrap">
                  {action.stop_loss_value !== null && (
                    <span className="text-bear">停損 {action.stop_loss_label}</span>
                  )}
                  {action.price_target_value !== null && (
                    <span className="text-bull">目標 {action.price_target_label}</span>
                  )}
                  {action.position_size_pct !== null && action.position_size_pct > 0 && (
                    <span className="text-text-muted">倉位 {action.position_size_label}</span>
                  )}
                </div>
                {action.conditions.length > 0 && (
                  <ul className="space-y-1">
                    {action.conditions.map((cond, i) => (
                      <li key={i} className={`text-xs flex items-center gap-1.5 ${
                        cond.includes('✓') ? 'text-bull' : cond.includes('✗') ? 'text-bear' : 'text-text-muted'
                      }`}>
                        <span>▸</span>{cond}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {entries.length > 0
        ? <JudgmentTimeline entries={entries} />
        : <EmptyState message="今日尚無盤中修正記錄" />
      }
    </div>
  )
}
