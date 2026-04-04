import type { PaperTradeSummary as PaperTradeSummaryType } from '../../types'

interface Props {
  data: PaperTradeSummaryType
}

function StatBox({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  const valueColor =
    positive === undefined
      ? 'text-text-primary'
      : positive
      ? 'text-bull'
      : 'text-bear'

  return (
    <div className="bg-bg-base rounded-md p-3 border border-border">
      <p className="label mb-1.5">{label}</p>
      <p className={`text-lg font-semibold font-mono ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function formatCurrency(n: number) {
  const abs = Math.abs(n)
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${abs.toLocaleString()}`
}

export function PaperTradeSummary({ data }: Props) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-title">紙上交易</p>
        <span className="text-xs text-text-muted font-mono">
          勝率 {Math.round(data.win_rate * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          label="今日損益"
          value={formatCurrency(data.today_pnl)}
          sub={`${data.today_pnl >= 0 ? '+' : ''}${data.today_pnl_pct.toFixed(2)}%`}
          positive={data.today_pnl >= 0}
        />
        <StatBox
          label="累積損益"
          value={formatCurrency(data.total_pnl)}
          sub={`${data.total_pnl >= 0 ? '+' : ''}${data.total_pnl_pct.toFixed(2)}%`}
          positive={data.total_pnl >= 0}
        />
        <StatBox
          label="可用資金"
          value={`$${data.available_cash.toLocaleString()}`}
          sub={`共 $${data.virtual_capital.toLocaleString()}`}
        />
        <StatBox
          label="持倉數"
          value={String(data.open_positions.length)}
          sub="筆未平倉"
        />
      </div>

      {/* Open positions */}
      {data.open_positions.length > 0 && (
        <div>
          <p className="label mb-2">未平倉部位</p>
          <div className="space-y-2">
            {data.open_positions.map((pos) => (
              <div
                key={pos.ticker}
                className="flex items-center justify-between p-3 bg-bg-base rounded-md border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-6 rounded-full ${pos.direction === 'long' ? 'bg-bull' : 'bg-bear'}`} />
                  <div>
                    <p className="text-sm font-semibold font-mono text-text-primary">{pos.ticker}</p>
                    <p className="text-xs text-text-muted">{pos.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold font-mono ${pos.pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {formatCurrency(pos.pnl)}
                  </p>
                  <p className={`text-xs font-mono ${pos.pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl_pct.toFixed(2)}%
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-text-muted">進場</p>
                  <p className="text-sm font-mono text-text-secondary">{pos.entry_price}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-text-muted">現價</p>
                  <p className="text-sm font-mono text-text-primary">{pos.current_price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
