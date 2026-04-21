import { TradeCandidateList } from '../components/dashboard/TradeCandidateList'
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../components/ui/LoadingSpinner'
import type { NewsDigest as NewsDigestData, NewsItem, NewsImportance, DriverBias, NewsConfidence, NewsStatus } from '../types'

interface Props {
  news: NewsDigestData | null
  loading: boolean
  error?: string | null
}

const importanceClass: Record<NewsImportance, string> = {
  high: 'bg-danger/15 text-danger border-danger/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-border/50 text-text-muted border-border',
}

const importanceLabel: Record<NewsImportance, string> = {
  high: '高優先',
  medium: '中優先',
  low: '低優先',
}

const confidenceLabel: Record<NewsConfidence, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const statusLabel: Record<NewsStatus, string> = {
  new: '新出現',
  ongoing: '持續中',
  fading: '鈍化中',
  invalidated: '已失效',
}

const driverBiasClass: Record<DriverBias, string> = {
  supportive: 'text-bull',
  pressure: 'text-bear',
  mixed: 'text-warning',
}

const driverBiasLabel: Record<DriverBias, string> = {
  supportive: '偏支撐',
  pressure: '偏壓力',
  mixed: '混合',
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start gap-3 justify-between flex-wrap">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${importanceClass[item.importance]}`}>
              {importanceLabel[item.importance]}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border text-text-muted bg-bg-base">
              {statusLabel[item.status]}
            </span>
            <span className="text-xs font-mono text-text-muted">{item.driver_tag}</span>
          </div>
          <h3 className="text-base font-semibold text-text-primary leading-snug">{item.title}</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted font-mono">
            <span>{item.source_name}</span>
            <span>•</span>
            <span>{item.published_at_label}</span>
            <span>•</span>
            <span>信心 {confidenceLabel[item.confidence]}</span>
          </div>
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-mono shrink-0"
        >
          原文連結
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14h14" />
          </svg>
        </a>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{item.summary}</p>

      <div className="bg-bg-base border border-border rounded-md p-3 space-y-2">
        <p className="label">為什麼重要</p>
        <p className="text-sm text-text-secondary leading-relaxed">{item.why_it_matters}</p>
      </div>

      <div className="flex items-start gap-4 flex-wrap text-xs">
        <div>
          <p className="label mb-1">影響族群</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.affected_groups.map((group) => (
              <span key={group} className="px-2 py-0.5 rounded border border-border text-text-secondary bg-bg-base">
                {group}
              </span>
            ))}
          </div>
        </div>

        {item.related_tickers.length > 0 && (
          <div>
            <p className="label mb-1">相關標的</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.related_tickers.map((ticker) => (
                <span key={ticker} className="px-2 py-0.5 rounded border border-accent/30 text-accent bg-accent/10 font-mono">
                  {ticker}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export function NewsDigest({ news, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入今日消息..." />
  if (error) return <ErrorDisplay message={error} />
  if (!news) return <EmptyState message="今日消息尚未發布" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">今日消息</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {news.date} · 彙整時間 {news.generated_at_label}
        </p>
      </div>

      <div className="card p-5 space-y-4 border-l-4 border-l-accent">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${importanceClass.high}`}>
            主導消息
          </span>
          <span className={`text-xs font-medium ${driverBiasClass[news.primary_driver.bias]}`}>
            {driverBiasLabel[news.primary_driver.bias]}
          </span>
          <span className="text-xs text-text-muted font-mono">
            狀態 {statusLabel[news.primary_driver.status]} · 信心 {confidenceLabel[news.primary_driver.confidence]}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text-primary leading-snug">{news.primary_driver.title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">{news.primary_driver.summary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="bg-bg-base border border-border rounded-md p-4 space-y-2">
            <p className="label">為什麼今天要注意</p>
            <p className="text-sm text-text-secondary leading-relaxed">{news.primary_driver.why_it_matters}</p>
          </div>

          <div className="bg-bg-base border border-border rounded-md p-4 space-y-2">
            <p className="label">主要影響族群</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {news.primary_driver.affected_groups.map((group) => (
                <span key={group} className="px-2 py-0.5 rounded border border-border text-text-secondary bg-bg-card text-xs">
                  {group}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {news.secondary_drivers.length > 0 && (
        <div className="card p-4">
          <p className="section-title mb-3">次要 driver</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {news.secondary_drivers.map((driver) => (
              <div key={driver.title} className="bg-bg-base border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary leading-snug">{driver.title}</p>
                  <span className={`text-xs font-medium ${driverBiasClass[driver.bias]}`}>
                    {driverBiasLabel[driver.bias]}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{driver.summary}</p>
                <p className="text-xs text-text-muted">{driver.why_it_matters}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <TradeCandidateList
        title="台股動態候選池"
        items={news.local_trade_candidates ?? []}
        emptyMessage="這輪消息層還沒整理出本地候選池。"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="section-title">消息列表</p>
          <span className="text-xs text-text-muted font-mono">共 {news.news_items.length} 則</span>
        </div>
        {news.news_items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
        <div className="card p-4">
          <p className="section-title mb-3">消息 → 市場影響</p>
          <div className="space-y-3">
            {news.market_implications.map((item) => (
              <div key={`${item.group}-${item.driver_link}`} className="bg-bg-base border border-border rounded-md p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary">{item.group}</p>
                  <span className="text-xs font-mono text-text-muted">{item.driver_link}</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{item.impact}</p>
                <p className="text-xs text-text-muted">操作含義：{item.action_bias}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="section-title mb-3">觀察提醒</p>
            <ul className="space-y-2">
              {news.watchpoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-warning shrink-0">⚠</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <p className="section-title mb-2">補充說明</p>
            <p className="text-sm text-text-secondary leading-relaxed">{news.notes}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
