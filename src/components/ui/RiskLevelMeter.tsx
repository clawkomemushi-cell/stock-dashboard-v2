import type { RiskLevel } from '../../types'

const labels: Record<RiskLevel, string> = {
  1: '低風險',
  2: '偏低',
  3: '中等',
  4: '偏高',
  5: '高風險',
}

const segmentColors = [
  'bg-bull',           // 1
  'bg-[#86efac]',      // 2
  'bg-warning',        // 3
  'bg-bear',           // 4
  'bg-danger',         // 5
]

interface Props {
  level: RiskLevel
  showLabel?: boolean
}

export function RiskLevelMeter({ level, showLabel = true }: Props) {
  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="label">風險等級</span>
          <span className={`text-sm font-semibold font-mono ${
            level <= 2 ? 'text-bull' : level === 3 ? 'text-warning' : level === 4 ? 'text-bear' : 'text-danger'
          }`}>
            {level} / 5 — {labels[level]}
          </span>
        </div>
      )}
      <div className="flex gap-1 h-2">
        {([1, 2, 3, 4, 5] as RiskLevel[]).map((n) => (
          <div
            key={n}
            className={`flex-1 rounded-sm transition-opacity duration-300 ${
              n <= level ? segmentColors[n - 1] : 'bg-border'
            } ${n <= level ? 'opacity-100' : 'opacity-30'}`}
          />
        ))}
      </div>
    </div>
  )
}
