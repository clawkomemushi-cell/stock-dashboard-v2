import { Link } from 'react-router-dom'
import type { NewsReferenceLink } from '../../types'

interface Props {
  title: string
  summary: string
  whyItMatters?: string
  driverStatus?: string
  affectedGroups?: string[]
  actionBias?: string
  riskIfWrong?: string
  links?: NewsReferenceLink[]
}

export function DriverContextCard({
  title,
  summary,
  whyItMatters,
  driverStatus,
  affectedGroups = [],
  actionBias,
  riskIfWrong,
  links = [],
}: Props) {
  return (
    <div className="card p-4 space-y-4 border-l-4 border-l-accent">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="section-title">{title}</p>
          {driverStatus && <p className="text-xs text-text-muted font-mono mt-1">狀態：{driverStatus}</p>}
        </div>
        <Link to="/news" className="text-xs text-accent hover:underline font-mono">
          查看今日消息 →
        </Link>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>

      {whyItMatters && (
        <div className="bg-bg-base border border-border rounded-md p-3 space-y-1.5">
          <p className="label">為什麼重要</p>
          <p className="text-sm text-text-secondary leading-relaxed">{whyItMatters}</p>
        </div>
      )}

      {(affectedGroups.length > 0 || actionBias || riskIfWrong) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
          {affectedGroups.length > 0 && (
            <div className="bg-bg-base border border-border rounded-md p-3 space-y-2">
              <p className="label">影響族群</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {affectedGroups.map((group) => (
                  <span key={group} className="px-2 py-0.5 rounded border border-border text-text-secondary bg-bg-card text-xs">
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}

          {actionBias && (
            <div className="bg-bg-base border border-border rounded-md p-3 space-y-1.5">
              <p className="label">操作含義</p>
              <p className="text-sm text-text-secondary leading-relaxed">{actionBias}</p>
            </div>
          )}

          {riskIfWrong && (
            <div className="bg-bg-base border border-border rounded-md p-3 space-y-1.5">
              <p className="label">若看錯</p>
              <p className="text-sm text-text-secondary leading-relaxed">{riskIfWrong}</p>
            </div>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="space-y-2">
          <p className="label">消息依據</p>
          <div className="space-y-2">
            {links.map((item) => (
              <a
                key={`${item.label}-${item.url}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block bg-bg-base border border-border rounded-md p-3 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <span className="text-sm text-text-primary font-medium leading-snug">{item.label}</span>
                  <span className="text-xs text-text-muted font-mono">{item.source_name ?? '來源連結'}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
