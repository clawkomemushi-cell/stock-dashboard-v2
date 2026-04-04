import type { DailyThesis } from '../../types'

interface Props {
  thesis: DailyThesis
}

function PriceLevel({
  price,
  label,
  strength,
  type,
}: {
  price: number
  label: string
  strength: 'strong' | 'medium' | 'weak'
  type: 'support' | 'resistance'
}) {
  const typeColor = type === 'support' ? 'text-bull' : 'text-bear'
  const strengthDot =
    strength === 'strong'
      ? 'bg-current opacity-100'
      : strength === 'medium'
      ? 'bg-current opacity-60'
      : 'bg-current opacity-30'

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${typeColor} ${strengthDot}`} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <span className={`text-sm font-semibold font-mono ${typeColor}`}>
        {price.toLocaleString()}
      </span>
    </div>
  )
}

export function MarketContextPanel({ thesis }: Props) {
  return (
    <div className="card p-4 space-y-4 h-full">
      <p className="section-title">市場環境</p>

      {/* Context items */}
      <div className="space-y-3">
        {[
          { label: '指數趨勢', value: thesis.market_context.index_trend },
          { label: '量能狀況', value: thesis.market_context.volume_status },
          { label: '外資動向', value: thesis.market_context.foreign_capital },
          { label: '三大法人', value: thesis.market_context.institutional_summary },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="label mb-1">{label}</p>
            <p className="text-sm text-text-secondary leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {/* Key risks */}
      <div>
        <p className="label mb-2">關鍵風險</p>
        <ul className="space-y-1.5">
          {thesis.key_risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="text-bear shrink-0 mt-0.5">▸</span>
              <span>{risk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Resistance */}
      <div>
        <p className="label mb-2">壓力位</p>
        {thesis.resistance_levels.map((r, i) => (
          <PriceLevel key={i} {...r} type="resistance" />
        ))}
      </div>

      {/* Support */}
      <div>
        <p className="label mb-2">支撐位</p>
        {thesis.support_levels.map((s, i) => (
          <PriceLevel key={i} {...s} type="support" />
        ))}
      </div>
    </div>
  )
}
