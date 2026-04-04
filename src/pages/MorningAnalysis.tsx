import { MarketContextPanel } from '../components/dashboard/MarketContextPanel'
import { ConfidenceBar } from '../components/ui/ConfidenceBar'
import { RiskLevelMeter } from '../components/ui/RiskLevelMeter'
import { DirectionBadge } from '../components/ui/Badge'
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import { WatchlistTable } from '../components/dashboard/WatchlistTable'
import { LoadingSpinner, ErrorDisplay } from '../components/ui/LoadingSpinner'
import type { DailyThesis } from '../types'

interface Props {
  thesis: DailyThesis | null
  loading: boolean
  error?: string | null
}

export function MorningAnalysis({ thesis, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入盤前分析..." />
  if (error) return <ErrorDisplay message={error} />
  if (!thesis) return <ErrorDisplay message="找不到盤前分析資料" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">盤前分析</h1>
        <p className="text-sm text-text-muted mt-0.5">{thesis.date} · 發布時間 {thesis.generated_at_label}</p>
      </div>

      {/* Hero section */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <DirectionBadge direction={thesis.direction_bias} size="lg" />
          <span className="text-sm text-text-muted">操作風格：
            <span className="text-text-secondary font-medium">{thesis.trading_style}</span>
          </span>
        </div>
        <h2 className="text-lg font-semibold text-text-primary leading-snug">{thesis.headline}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{thesis.core_thesis}</p>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <RiskLevelMeter level={thesis.risk_level} />
          <ConfidenceBar value={thesis.confidence} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <MarketContextPanel thesis={thesis} />

        <div className="space-y-4">
          <CollapsibleSection title="禁止事項" defaultOpen>
            <ul className="p-4 space-y-2">
              {thesis.prohibitions.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-danger shrink-0">✕</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="注意事項" defaultOpen>
            <ul className="p-4 space-y-2">
              {thesis.cautions.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-warning shrink-0">⚠</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {thesis.notes && (
            <div className="card p-4">
              <p className="label mb-2">補充備註</p>
              <p className="text-sm text-text-secondary leading-relaxed italic">{thesis.notes}</p>
            </div>
          )}
        </div>
      </div>

      <WatchlistTable items={thesis.watchlist} />
    </div>
  )
}
