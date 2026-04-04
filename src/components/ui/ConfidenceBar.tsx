interface Props {
  value: number   // 0.0 – 1.0
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ConfidenceBar({ value, showLabel = true, size = 'md' }: Props) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 75 ? 'bg-accent' :
    pct >= 55 ? 'bg-warning' :
    'bg-bear'

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="label">信心度</span>
          <span className="text-sm font-semibold font-mono text-text-primary">{pct}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-border ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
