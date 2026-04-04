import { PaperTradeSummary } from '../components/dashboard/PaperTradeSummary'
import { TradeDirectionBadge } from '../components/ui/Badge'
import { LoadingSpinner, ErrorDisplay } from '../components/ui/LoadingSpinner'
import type { ActionPlan } from '../types'

interface Props {
  actionPlan: ActionPlan | null
  loading: boolean
  error?: string | null
}

export function PaperTrade({ actionPlan, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入紙上交易資料..." />
  if (error) return <ErrorDisplay message={error} />
  if (!actionPlan) return <ErrorDisplay message="找不到操作計畫資料" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">紙上交易</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {actionPlan.date} · v{actionPlan.version} · 最大曝險 {actionPlan.max_exposure_label}
        </p>
      </div>

      <PaperTradeSummary data={actionPlan.paper_trade} />

      {/* Overall stance */}
      <div className="card p-4 border-l-4 border-l-accent">
        <p className="label mb-1.5">今日操作總結</p>
        <p className="text-sm text-text-secondary leading-relaxed">{actionPlan.overall_stance}</p>
      </div>

      {/* Detailed action list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="section-title">操作明細</p>
        </div>
        <div className="divide-y divide-border">
          {actionPlan.actions.map((action) => (
            <div key={action.ticker} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <span className="font-mono font-bold text-base text-text-primary">{action.ticker}</span>
                    <span className="text-text-secondary text-sm ml-2">{action.name}</span>
                  </div>
                  <TradeDirectionBadge direction={action.direction} />
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono ${
                    action.status === 'executed' ? 'border-bull/30 text-bull bg-bull/10' :
                    action.status === 'cancelled' ? 'border-border text-text-muted' :
                    'border-accent/30 text-accent bg-accent/10'
                  }`}>
                    {action.status === 'executed' ? '已執行' : action.status === 'cancelled' ? '已取消' : '進行中'}
                  </span>
                </div>
                <span className="text-xs text-text-muted font-mono shrink-0">{action.position_size_label}</span>
              </div>

              <p className="text-sm text-text-secondary">{action.rationale}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-bg-base rounded-md p-3 border border-border">
                  <p className="label mb-1">進場目標</p>
                  <p className="text-sm font-mono text-text-primary">{action.price_target_label}</p>
                </div>
                <div className="bg-bg-base rounded-md p-3 border border-danger/20">
                  <p className="label mb-1 text-danger">停損</p>
                  <p className="text-sm font-mono text-bear">{action.stop_loss_label}</p>
                </div>
                <div className="bg-bg-base rounded-md p-3 border border-border col-span-2 sm:col-span-1">
                  <p className="label mb-1">操作行動</p>
                  <p className="text-sm text-text-secondary">{action.action}</p>
                </div>
              </div>

              {action.conditions.length > 0 && (
                <div>
                  <p className="label mb-2">進場條件確認</p>
                  <ul className="space-y-1">
                    {action.conditions.map((cond, i) => (
                      <li key={i} className={`text-xs flex items-center gap-2 ${
                        cond.includes('✓') ? 'text-bull' : cond.includes('✗') ? 'text-bear' : 'text-text-muted'
                      }`}>
                        <span>{cond.includes('✓') ? '✓' : cond.includes('✗') ? '✗' : '○'}</span>
                        <span>{cond.replace(/[✓✗]/g, '').trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {actionPlan.notes && (
        <div className="card p-4">
          <p className="label mb-2">備註</p>
          <p className="text-sm text-text-muted italic">{actionPlan.notes}</p>
        </div>
      )}
    </div>
  )
}
