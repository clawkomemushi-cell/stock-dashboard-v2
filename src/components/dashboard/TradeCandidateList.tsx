import type { TradeCandidate } from '../../types'

interface Props {
  title: string
  items: TradeCandidate[]
  emptyMessage?: string
}

const priorityColor = {
  high: 'text-danger border-danger/30 bg-danger/10',
  medium: 'text-warning border-warning/30 bg-warning/10',
  low: 'text-text-muted border-border bg-bg-base',
}

const roleLabel: Record<TradeCandidate['role'], string> = {
  lead: '主受惠',
  starter: '可先手',
  watch: '優先觀察',
  observe: '次觀察',
  avoid: '先避開',
  hedge: '避險對照',
}

const kindLabel: Record<TradeCandidate['kind'], string> = {
  stock: '個股',
  etf: 'ETF',
  basket: '族群籃子',
}

export function TradeCandidateList({ title, items, emptyMessage = '今天沒有可用候選' }: Props) {
  if (!items.length) {
    return (
      <div className="card p-4">
        <p className="section-title mb-2">{title}</p>
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="section-title">{title}</p>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => {
          const sourceBasisRaw = (item as unknown as { source_basis?: string[] | string }).source_basis
          const sourceBasis = Array.isArray(sourceBasisRaw)
            ? sourceBasisRaw
            : (typeof sourceBasisRaw === 'string' && sourceBasisRaw.trim().length > 0)
              ? [sourceBasisRaw]
              : []

          return (
          <div key={`${item.ticker}-${item.role}`} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-base text-text-primary">{item.ticker}</span>
                  <span className="text-sm text-text-secondary">{item.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded border border-border text-text-muted bg-bg-base">
                    {kindLabel[item.kind]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${priorityColor[item.priority]}`}>
                    {roleLabel[item.role]}
                  </span>
                </div>
                <p className="text-xs text-text-muted">主題：{item.theme}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-3">
              <div className="space-y-3">
                <div className="bg-bg-base border border-border rounded-md p-3">
                  <p className="label mb-1">為什麼進候選池</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.why_selected}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-bg-base border border-border rounded-md p-3">
                    <p className="label mb-1">觸發條件</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.trigger_to_act}</p>
                  </div>
                  <div className="bg-bg-base border border-border rounded-md p-3">
                    <p className="label mb-1">失效條件</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.invalidation}</p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-base border border-border rounded-md p-3">
                <p className="label mb-2">入選依據</p>
                <div className="flex flex-wrap gap-1.5">
                  {sourceBasis.length > 0 ? sourceBasis.map((source) => (
                    <span key={source} className="px-2 py-0.5 rounded border border-border text-xs text-text-secondary bg-bg-card">
                      {source}
                    </span>
                  )) : (
                    <span className="text-xs text-text-muted">暫無結構化依據欄位</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
