import { useState } from 'react'
import { MarketStatusBadge } from '../ui/Badge'
import { DataHealthPanel, HealthDotStrip } from '../ui/DataHealthPanel'
import type { LatestIndex, FileHealth } from '../../types'

interface Props {
  latest: LatestIndex | null
  healthMap: Record<string, FileHealth>
}

function formatDate(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split('-')
    return new Date(Number(y), Number(m) - 1, Number(d))
      .toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })
  } catch { return dateStr }
}

export function TopBar({ latest, healthMap }: Props) {
  const [healthOpen, setHealthOpen] = useState(false)
  const healths = Object.values(healthMap)

  return (
    <div className="relative">
      <header className="h-12 bg-bg-card border-b border-border flex items-center px-4 md:px-6 gap-4 shrink-0">
        {/* Date */}
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-text-secondary font-medium truncate">
            {latest ? formatDate(latest.date) : '—'}
          </span>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {latest && <MarketStatusBadge status={latest.market_status} />}

        <div className="flex-1" />

        {/* Health mini strip — click to toggle panel */}
        <button
          onClick={() => setHealthOpen(o => !o)}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-hover transition-colors"
          title="資料健康狀態"
        >
          <HealthDotStrip healths={healths} />
          <span className="text-xs text-text-muted hidden sm:inline font-mono">Health</span>
        </button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Last updated */}
        {latest && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">更新</span>
            <span>{latest._meta.generated_at_label}</span>
          </div>
        )}
      </header>

      {/* Health panel dropdown */}
      {healthOpen && (
        <div className="absolute top-12 right-0 z-50 w-full md:w-[600px] px-4 md:px-6 pt-2">
          <DataHealthPanel
            latest={latest}
            latestError={null}
            healthMap={healthMap}
            activePage={null}
            defaultOpen
          />
        </div>
      )}
      {/* Click-away to close */}
      {healthOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setHealthOpen(false)}
        />
      )}
    </div>
  )
}
