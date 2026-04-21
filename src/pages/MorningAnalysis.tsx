import { MarketContextPanel } from '../components/dashboard/MarketContextPanel'
import { DriverContextCard } from '../components/dashboard/DriverContextCard'
import { ConfidenceBar } from '../components/ui/ConfidenceBar'
import { RiskLevelMeter } from '../components/ui/RiskLevelMeter'
import { DirectionBadge } from '../components/ui/Badge'
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import { WatchlistTable } from '../components/dashboard/WatchlistTable'
import { TradeCandidateList } from '../components/dashboard/TradeCandidateList'
import { LoadingSpinner, ErrorDisplay } from '../components/ui/LoadingSpinner'
import type { DailyThesis, MorningView, MarketDriverSummaryBlock } from '../types'

interface Props {
  thesis: DailyThesis | null
  morningView?: MorningView | null
  loading: boolean
  error?: string | null
}

export function MorningAnalysis({ thesis, morningView, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入盤前分析..." />
  if (error) return <ErrorDisplay message={error} />
  if (!thesis && !morningView) return <ErrorDisplay message="找不到盤前分析資料" />

  const displayDate = morningView?.date ?? thesis?.date
  const displayTime = morningView?._meta.generated_at_label?.split(' ').slice(-1)[0] ?? thesis?.generated_at_label
  const displayDirection = morningView?.hero.direction_bias ?? thesis?.direction_bias
  const displayStyle = morningView?.hero.trading_style ?? thesis?.trading_style
  const displayHeadline = morningView?.headline ?? thesis?.headline
  const displayCore = morningView?.sections.core_thesis ?? thesis?.core_thesis
  const displayRisk = morningView?.hero.risk_level ?? thesis?.risk_level
  const displayConfidence = morningView?.hero.confidence ?? thesis?.confidence
  const marketContextThesis = thesis ? {
    ...thesis,
    market_context: morningView?.sections.market_context ?? thesis.market_context,
    key_risks: morningView?.sections.key_risks ?? thesis.key_risks,
    support_levels: morningView?.sections.support_levels ?? thesis.support_levels,
    resistance_levels: morningView?.sections.resistance_levels ?? thesis.resistance_levels,
  } : null
  const prohibitions = morningView?.sections.prohibitions ?? thesis?.prohibitions ?? []
  const cautions = morningView?.sections.cautions ?? thesis?.cautions ?? []
  const notes = morningView?.sections.notes ?? thesis?.notes
  const watchlist = morningView?.sections.watchlist ?? thesis?.watchlist ?? []
  const driverSummary = thesis?.market_driver_summary
  const candidatePool = thesis?.candidate_pool ?? []
  const normalizedDriverSummary: MarketDriverSummaryBlock | null =
    typeof driverSummary === 'string'
      ? { summary: driverSummary }
      : driverSummary ?? null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">盤前分析</h1>
        <p className="text-sm text-text-muted mt-0.5">{displayDate} · 發布時間 {displayTime}</p>
      </div>

      {/* Hero section */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {displayDirection && <DirectionBadge direction={displayDirection} size="lg" />}
          <span className="text-sm text-text-muted">操作風格：
            <span className="text-text-secondary font-medium">{displayStyle}</span>
          </span>
        </div>
        <h2 className="text-lg font-semibold text-text-primary leading-snug">{displayHeadline}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{displayCore}</p>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          {displayRisk && <RiskLevelMeter level={displayRisk} />}
          {displayConfidence !== undefined && <ConfidenceBar value={displayConfidence} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {marketContextThesis ? <MarketContextPanel thesis={marketContextThesis} /> : <div className="card p-4 text-sm text-text-muted">缺少市場環境資料</div>}

        <div className="space-y-4">
          {normalizedDriverSummary && (
            <DriverContextCard
              title="消息主線"
              summary={normalizedDriverSummary.summary}
              whyItMatters={normalizedDriverSummary.why_it_matters}
              driverStatus={normalizedDriverSummary.driver_status}
              affectedGroups={normalizedDriverSummary.affected_groups}
              links={normalizedDriverSummary.news_links}
            />
          )}

          <CollapsibleSection title="禁止事項" defaultOpen>
            <ul className="p-4 space-y-2">
              {prohibitions.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-danger shrink-0">✕</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="注意事項" defaultOpen>
            <ul className="p-4 space-y-2">
              {cautions.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-warning shrink-0">⚠</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {notes && (
            <div className="card p-4">
              <p className="label mb-2">補充備註</p>
              <p className="text-sm text-text-secondary leading-relaxed italic">{notes}</p>
            </div>
          )}
        </div>
      </div>

      <TradeCandidateList
        title="動態候選池"
        items={candidatePool}
        emptyMessage="今天沒有額外入選的動態候選，先看下方觀察標的。"
      />

      <WatchlistTable items={watchlist} />
    </div>
  )
}
