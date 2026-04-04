import { useState } from 'react'
import type { ThesisCheckEntry } from '../../types'

const changeTypeLabel: Record<string, { label: string; color: string }> = {
  direction_flip:    { label: '方向翻轉', color: 'text-danger bg-danger/10 border-danger/20' },
  confidence_adjust: { label: '信心調整', color: 'text-warning bg-warning/10 border-warning/20' },
  target_update:     { label: '目標更新', color: 'text-accent bg-accent/10 border-accent/20' },
  risk_update:       { label: '風險調整', color: 'text-bear bg-bear/10 border-bear/20' },
  no_change:         { label: '維持不變', color: 'text-bull bg-bull/10 border-bull/20' },
}

function RiskChangeIndicator({ change }: { change: number | null }) {
  if (!change) return null
  return (
    <span className={`text-xs font-mono font-semibold ${change > 0 ? 'text-bear' : 'text-bull'}`}>
      風險 {change > 0 ? `+${change}` : change}
    </span>
  )
}

function ConfidenceChangeIndicator({ change }: { change: number | null }) {
  if (!change) return null
  const pct = Math.round(change * 100)
  return (
    <span className={`text-xs font-mono font-semibold ${pct > 0 ? 'text-bull' : 'text-bear'}`}>
      信心 {pct > 0 ? `+${pct}%` : `${pct}%`}
    </span>
  )
}

function TimelineEntry({ entry, isLast }: { entry: ThesisCheckEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = changeTypeLabel[entry.change_type] ?? changeTypeLabel.no_change

  return (
    <div className="relative flex gap-4">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[19px] top-8 bottom-0 w-px bg-border" />
      )}

      {/* Dot */}
      <div className="relative flex-shrink-0 w-10 flex justify-center">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 z-10
          ${entry.change_type === 'direction_flip' ? 'border-danger bg-danger/20' :
            entry.change_type === 'no_change' ? 'border-bull bg-bull/20' :
            'border-warning bg-warning/20'}`}>
          <div className={`w-2 h-2 rounded-full
            ${entry.change_type === 'direction_flip' ? 'bg-danger' :
              entry.change_type === 'no_change' ? 'bg-bull' :
              'bg-warning'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-sm font-semibold font-mono text-text-primary">
            {entry.timestamp}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded border ${cfg.color}`}>
            {cfg.label}
          </span>
          <RiskChangeIndicator change={entry.risk_level_change} />
          <ConfidenceChangeIndicator change={entry.confidence_change} />
        </div>

        {/* Trigger */}
        <p className="text-xs text-text-muted mb-2">{entry.trigger}</p>

        {/* Snapshot */}
        <div className="flex items-center gap-3 mb-2 font-mono">
          <span className="text-sm font-semibold text-text-primary">
            {entry.market_snapshot.taiex_level.toLocaleString()}
          </span>
          <span className={`text-xs font-semibold ${
            entry.market_snapshot.taiex_change_pct < 0 ? 'text-bear' : 'text-bull'
          }`}>
            {entry.market_snapshot.taiex_change_pct > 0 ? '+' : ''}
            {entry.market_snapshot.taiex_change_pct.toFixed(2)}%
          </span>
          <span className="text-xs text-text-muted">
            量比 {entry.market_snapshot.volume_ratio.toFixed(2)}x
          </span>
        </div>

        {/* Expandable detail */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
        >
          {expanded ? '收起' : '展開分析'}
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {entry.change_type !== 'no_change' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-bg-base border border-border">
                  <p className="label mb-1.5">原論點</p>
                  <p className="text-xs text-text-muted leading-relaxed line-through">
                    {entry.original_thesis}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-bg-base border border-accent/20">
                  <p className="label mb-1.5 text-accent">修正後</p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {entry.revised_thesis}
                  </p>
                </div>
              </div>
            )}
            {entry.change_type === 'no_change' && (
              <div className="p-3 rounded-md bg-bg-base border border-border">
                <p className="text-xs text-text-secondary leading-relaxed">
                  {entry.revised_thesis}
                </p>
              </div>
            )}
            {entry.notes && (
              <p className="text-xs text-text-muted italic px-1">{entry.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  entries: ThesisCheckEntry[]
}

export function JudgmentTimeline({ entries }: Props) {
  if (!entries.length) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-muted text-sm">尚無盤中修正記錄</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="section-title mb-5">判斷演變 Timeline</p>
      <div>
        {entries.map((entry, i) => (
          <TimelineEntry key={entry.id} entry={entry} isLast={i === entries.length - 1} />
        ))}
      </div>
    </div>
  )
}
