import type { MarketStatus, DirectionBias, RiskLevel, Verdict, TradeDirection } from '../../types'

// ---- Market Status Badge ----
const marketStatusConfig: Record<MarketStatus, { label: string; color: string }> = {
  pre_market:  { label: '盤前', color: 'bg-warning/20 text-warning border-warning/30' },
  opening:     { label: '開盤', color: 'bg-bull/20 text-bull border-bull/30' },
  intraday:    { label: '盤中', color: 'bg-accent/20 text-accent border-accent/30' },
  mid_session: { label: '盤中', color: 'bg-accent/20 text-accent border-accent/30' },
  closing:     { label: '收盤中', color: 'bg-warning/20 text-warning border-warning/30' },
  closed:      { label: '已收盤', color: 'bg-border/50 text-text-secondary border-border' },
  holiday:     { label: '休市', color: 'bg-border/50 text-text-muted border-border' },
}

const unknownMarketStatusConfig = {
  label: '狀態未知',
  color: 'bg-border/50 text-text-muted border-border',
}

export function MarketStatusBadge({ status }: { status: MarketStatus | string }) {
  const cfg = marketStatusConfig[status as MarketStatus] ?? unknownMarketStatusConfig
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.color}`}>
      {status !== 'closed' && status !== 'holiday' && status !== 'unknown' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow" />
      )}
      {cfg.label}
    </span>
  )
}

// ---- Direction Badge ----
const directionConfig: Record<DirectionBias, { label: string; icon: string; color: string }> = {
  bullish: { label: '偏多', icon: '↑', color: 'bg-bull/15 text-bull border-bull/30' },
  bearish: { label: '偏空', icon: '↓', color: 'bg-bear/15 text-bear border-bear/30' },
  neutral: { label: '觀望', icon: '→', color: 'bg-border/50 text-text-secondary border-border' },
}

export function DirectionBadge({ direction, size = 'md' }: { direction: DirectionBias; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = directionConfig[direction]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-semibold border font-mono ${sizeClass} ${cfg.color}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  )
}

// ---- Trade Direction Badge ----
const tradeDirectionConfig: Record<TradeDirection, { label: string; color: string }> = {
  long:  { label: '做多', color: 'bg-bull/15 text-bull border-bull/30' },
  short: { label: '放空', color: 'bg-bear/15 text-bear border-bear/30' },
  watch: { label: '觀察', color: 'bg-warning/15 text-warning border-warning/30' },
  avoid: { label: '迴避', color: 'bg-border/50 text-text-muted border-border' },
  hold:  { label: '保留', color: 'bg-accent/15 text-accent border-accent/30' },
}

const unknownTradeDirectionConfig = {
  label: '未知',
  color: 'bg-border/50 text-text-muted border-border',
}

export function TradeDirectionBadge({ direction }: { direction: TradeDirection | string }) {
  const cfg = tradeDirectionConfig[direction as TradeDirection] ?? unknownTradeDirectionConfig
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// ---- Risk Level Badge ----
const riskColors: Record<RiskLevel, string> = {
  1: 'bg-bull/20 text-bull border-bull/30',
  2: 'bg-bull/10 text-[#86efac] border-[#86efac]/30',
  3: 'bg-warning/20 text-warning border-warning/30',
  4: 'bg-bear/20 text-bear border-bear/30',
  5: 'bg-danger/30 text-danger border-danger/40',
}

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold font-mono border ${riskColors[level]}`}>
      RISK {level}
    </span>
  )
}

// ---- Verdict Badge ----
const verdictConfig: Record<Verdict, { label: string; color: string }> = {
  correct:   { label: '正確', color: 'bg-bull/15 text-bull border-bull/30' },
  incorrect: { label: '錯誤', color: 'bg-bear/15 text-bear border-bear/30' },
  partial:   { label: '部分', color: 'bg-warning/15 text-warning border-warning/30' },
  pending:   { label: '待驗', color: 'bg-border/50 text-text-muted border-border' },
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const cfg = verdictConfig[verdict]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
