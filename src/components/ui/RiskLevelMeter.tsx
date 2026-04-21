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
  level: RiskLevel | number | string
  showLabel?: boolean
}

function normalizeRiskLevel(level: RiskLevel | number | string): RiskLevel {
  if (typeof level === 'number' && level >= 1 && level <= 5) return level as RiskLevel
  const normalized = String(level).toLowerCase()
  if (normalized === 'low' || normalized === '偏低') return 2
  if (normalized === 'medium' || normalized === '中等') return 3
  if (normalized === 'high' || normalized === '偏高') return 4
  return 3
}

export function RiskLevelMeter({ level, showLabel = true }: Props) {
  const normalizedLevel = normalizeRiskLevel(level)

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="label">風險等級</span>
          <span className={`text-sm font-semibold font-mono ${
            normalizedLevel <= 2 ? 'text-bull' : normalizedLevel === 3 ? 'text-warning' : normalizedLevel === 4 ? 'text-bear' : 'text-danger'
          }`}>
            {normalizedLevel} / 5 — {labels[normalizedLevel]}
          </span>
        </div>
      )}
      <div className="flex gap-1 h-2">
        {([1, 2, 3, 4, 5] as RiskLevel[]).map((n) => (
          <div
            key={n}
            className={`flex-1 rounded-sm transition-opacity duration-300 ${
              n <= normalizedLevel ? segmentColors[n - 1] : 'bg-border'
            } ${n <= normalizedLevel ? 'opacity-100' : 'opacity-30'}`}
          />
        ))}
      </div>
    </div>
  )
}
