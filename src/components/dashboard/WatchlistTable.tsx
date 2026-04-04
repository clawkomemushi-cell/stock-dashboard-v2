import { TradeDirectionBadge } from '../ui/Badge'
import type { WatchlistItem } from '../../types'

interface Props {
  items: WatchlistItem[]
}

const priorityColor = {
  high:   'text-danger',
  medium: 'text-warning',
  low:    'text-text-muted',
}

export function WatchlistTable({ items }: Props) {
  if (!items.length) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="section-title">觀察標的</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-base/50">
              <th className="px-4 py-2.5 text-left label">代號</th>
              <th className="px-4 py-2.5 text-left label">名稱</th>
              <th className="px-4 py-2.5 text-left label">方向</th>
              <th className="px-4 py-2.5 text-left label hidden md:table-cell">進場條件</th>
              <th className="px-4 py-2.5 text-left label hidden lg:table-cell">停損</th>
              <th className="px-4 py-2.5 text-left label hidden lg:table-cell">目標</th>
              <th className="px-4 py-2.5 text-center label">優先</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.ticker} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-text-primary">{item.ticker}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{item.name}</td>
                <td className="px-4 py-3">
                  <TradeDirectionBadge direction={item.direction} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-text-secondary max-w-xs leading-snug">{item.entry_condition}</p>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs font-mono text-bear">{item.stop_loss_label}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs font-mono text-bull">{item.take_profit_label}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-bold ${priorityColor[item.priority]}`}>
                    {item.priority === 'high' ? '★★★' : item.priority === 'medium' ? '★★' : '★'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
