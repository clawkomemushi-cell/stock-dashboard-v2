import { DirectionBadge, RiskLevelBadge } from '../ui/Badge'
import { RiskLevelMeter } from '../ui/RiskLevelMeter'
import { ConfidenceBar } from '../ui/ConfidenceBar'
import type { DailyThesis } from '../../types'

interface Props {
  thesis: DailyThesis
}

export function CoreThesisCard({ thesis }: Props) {
  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <DirectionBadge direction={thesis.direction_bias} size="lg" />
          <RiskLevelBadge level={thesis.risk_level} />
          <span className="text-xs text-text-muted font-mono">
            {thesis.trading_style}
          </span>
        </div>
        <span className="text-xs text-text-muted font-mono shrink-0">
          {thesis.generated_at_label}
        </span>
      </div>

      {/* Headline */}
      <div>
        <p className="text-xs text-text-muted mb-1.5 font-mono uppercase tracking-wider">今日核心判斷</p>
        <h2 className="text-base md:text-lg font-semibold text-text-primary leading-snug">
          {thesis.headline}
        </h2>
      </div>

      {/* Core thesis */}
      <p className="text-sm text-text-secondary leading-relaxed">
        {thesis.core_thesis}
      </p>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        <RiskLevelMeter level={thesis.risk_level} />
        <ConfidenceBar value={thesis.confidence} />
      </div>

      {/* Notes */}
      {thesis.notes && (
        <div className="pt-1 border-t border-border">
          <p className="text-xs text-text-muted italic">{thesis.notes}</p>
        </div>
      )}
    </div>
  )
}
