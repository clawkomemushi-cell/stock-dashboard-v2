import { useState } from 'react'
import type { LatestIndex, FileHealth, ActivePageContext } from '../../types'

// ---- Status dot colour ----
function statusDotClass(health: FileHealth): string {
  if (health.fetchStatus === 'loading') return 'bg-text-muted animate-pulse'
  if (health.fetchStatus === 'error')   return 'bg-danger'
  if (health.meta?.status === 'failed') return 'bg-danger'
  if (
    health.meta?.source_freshness === 'stale' ||
    health.meta?.status === 'partial' ||
    health.isFallback
  ) return 'bg-warning'
  if (health.fetchStatus === 'ok')      return 'bg-bull'
  return 'bg-text-muted'
}

function overallDotClass(healths: FileHealth[]): string {
  if (healths.some(h => h.fetchStatus === 'error' || h.meta?.status === 'failed'))
    return 'bg-danger'
  if (healths.some(h =>
    h.meta?.source_freshness === 'stale' ||
    h.meta?.status === 'partial' ||
    h.isFallback ||
    h.fetchStatus === 'loading'
  )) return 'bg-warning'
  if (healths.every(h => h.fetchStatus === 'ok')) return 'bg-bull'
  return 'bg-text-muted'
}

// ---- Mini dot strip for TopBar ----
export function HealthDotStrip({ healths }: { healths: FileHealth[] }) {
  return (
    <div className="flex items-center gap-1">
      {healths.map((h) => (
        <span
          key={h.key}
          title={`${h.label}: ${h.meta?.source_freshness ?? h.fetchStatus}`}
          className={`w-1.5 h-1.5 rounded-full ${statusDotClass(h)}`}
        />
      ))}
    </div>
  )
}

// ---- Per-file row inside the panel ----
function FileRow({
  fileKey,
  label,
  latestStatus,
  health,
}: {
  fileKey: string
  label: string
  latestStatus?: LatestIndex['file_statuses'][keyof LatestIndex['file_statuses']]
  health?: FileHealth
}) {
  const dotClass =
    health ? statusDotClass(health) :
    latestStatus?.status === 'success' ? 'bg-bull' :
    latestStatus?.status === 'partial' ? 'bg-warning' :
    latestStatus?.status === 'failed'  ? 'bg-danger' : 'bg-text-muted'

  const freshness = health?.meta?.source_freshness ?? '—'
  const updatedLabel = health?.meta?.generated_at_label ?? latestStatus?.updated_at_label ?? '—'
  const schemaVer = health?.meta?.schema_version ?? '—'

  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0 text-xs">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
      <span className="w-20 text-text-secondary shrink-0">{label}</span>
      <span className={`w-14 font-mono ${
        latestStatus?.status === 'success' || health?.fetchStatus === 'ok'
          ? 'text-bull' : latestStatus?.status === 'failed' || health?.fetchStatus === 'error'
          ? 'text-danger' : 'text-warning'
      }`}>
        {health?.fetchStatus === 'error' ? 'fetch err' : (latestStatus?.status ?? '—')}
      </span>
      <span className="w-12 font-mono text-text-muted">{updatedLabel}</span>
      <span className={`w-12 font-mono ${freshness === 'stale' ? 'text-warning' : freshness === 'fresh' ? 'text-bull' : 'text-text-muted'}`}>
        {freshness}
      </span>
      <span className="text-text-muted font-mono">v{schemaVer}</span>
      {health?.isFallback && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
          fallback
        </span>
      )}
    </div>
  )
}

// ---- Active page context block ----
function ActivePageBlock({
  activePage,
  health,
}: {
  activePage: ActivePageContext
  health: FileHealth | undefined
}) {
  if (!health) return null
  return (
    <div className="pt-3 mt-3 border-t border-border">
      <p className="label mb-2">當前頁面使用中 — {activePage.label}</p>
      <div className="space-y-1 text-xs font-mono">
        <div className="flex gap-2">
          <span className="text-text-muted w-14 shrink-0">路徑</span>
          <span className="text-text-secondary break-all">{health.path ?? '—'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-text-muted w-14 shrink-0">狀態</span>
          <span className={`flex items-center gap-1.5 ${
            health.fetchStatus === 'error' ? 'text-danger' :
            health.meta?.source_freshness === 'stale' ? 'text-warning' : 'text-bull'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(health)}`} />
            {health.meta?.status ?? health.fetchStatus}
            {health.meta?.source_freshness && ` · ${health.meta.source_freshness}`}
            {health.meta?.schema_version && ` · schema ${health.meta.schema_version}`}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-text-muted w-14 shrink-0">產生時間</span>
          <span className="text-text-secondary">{health.meta?.generated_at_iso ?? '—'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-text-muted w-14 shrink-0">Fallback</span>
          <span className={health.isFallback ? 'text-warning' : 'text-bull'}>
            {health.isFallback
              ? `是 → ${health.meta?.fallback_source ?? '上一版'}`
              : '否'}
          </span>
        </div>
        {health.fetchError && (
          <div className="flex gap-2">
            <span className="text-text-muted w-14 shrink-0">錯誤</span>
            <span className="text-danger">{health.fetchError}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Warnings block ----
function WarningsBlock({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null
  return (
    <div className="pt-3 mt-3 border-t border-border">
      <p className="label mb-2 text-warning">⚠ 系統警告</p>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="text-xs text-warning flex items-start gap-1.5">
            <span className="shrink-0 mt-0.5">·</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================
// Main DataHealthPanel
// ============================================================

interface Props {
  latest: LatestIndex | null
  latestError: string | null
  healthMap: Record<string, FileHealth>
  activePage: ActivePageContext | null
  defaultOpen?: boolean
}

const FILE_LABELS: Record<string, string> = {
  daily_thesis:        '盤前分析',
  action_plan:         '操作計畫',
  thesis_check:        '盤中修正',
  close_review:        '收盤檢討',
  weekly_review:       '週回顧',
  performance_history: '系統績效',
}

export function DataHealthPanel({
  latest, latestError, healthMap, activePage, defaultOpen = false,
}: Props) {
  const allHealths = Object.values(healthMap)

  // Auto-expand when there's a problem
  const hasIssue = allHealths.some(
    h => h.fetchStatus === 'error' ||
         h.meta?.status === 'failed' ||
         h.meta?.source_freshness === 'stale' ||
         h.isFallback,
  ) || !!latestError

  const [open, setOpen] = useState(defaultOpen || hasIssue)

  // Collect all warnings across loaded files
  const allWarnings = allHealths.flatMap(h => h.meta?.warnings ?? [])

  const overallClass = latestError ? 'bg-danger' : overallDotClass(allHealths)

  return (
    <div className="card border-border overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors duration-150"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${overallClass}`} />
        <span className="label">DATA HEALTH</span>
        <HealthDotStrip healths={allHealths} />
        <span className="flex-1" />
        <span className="text-xs text-text-muted font-mono">
          {latest ? `最後同步 ${latest._meta.generated_at_label}` : latestError ? '索引載入失敗' : '載入中...'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-border px-4 py-3 animate-fade-in space-y-0">
          {/* Index line */}
          <div className="flex items-center gap-3 pb-2 mb-2 border-b border-border text-xs">
            <span className={`w-2 h-2 rounded-full shrink-0 ${latestError ? 'bg-danger' : latest ? 'bg-bull' : 'bg-text-muted'}`} />
            <span className="text-text-muted">資料索引</span>
            <span className="font-mono text-text-secondary">latest.json</span>
            {latest && (
              <>
                <span className="font-mono text-text-muted">v{latest._meta.schema_version}</span>
                <span className={`font-mono ${latest._meta.source_freshness === 'fresh' ? 'text-bull' : 'text-warning'}`}>
                  {latest._meta.source_freshness}
                </span>
                <span className="font-mono text-text-muted">{latest._meta.generated_at_label}</span>
              </>
            )}
            {latestError && <span className="text-danger">{latestError}</span>}
          </div>

          {/* Per-file rows */}
          <div>
            {Object.entries(FILE_LABELS).map(([key, label]) => (
              <FileRow
                key={key}
                fileKey={key}
                label={label}
                latestStatus={latest?.file_statuses?.[key as keyof typeof latest.file_statuses]}
                health={healthMap[key]}
              />
            ))}
          </div>

          {/* Active page context */}
          {activePage && (
            <ActivePageBlock
              activePage={activePage}
              health={healthMap[activePage.fileKey]}
            />
          )}

          {/* Warnings */}
          <WarningsBlock warnings={allWarnings} />

          {/* latest.json path reference */}
          {latest && latest.paths.daily_thesis && (
            <p className="pt-2 mt-2 border-t border-border/30 text-[10px] text-text-muted font-mono">
              使用資料：{latest.paths.daily_thesis.replace(/\/[^/]+$/, '/')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
