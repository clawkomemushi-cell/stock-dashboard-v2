import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  LatestIndex,
  DailyThesis,
  ActionPlan,
  ThesisCheckDoc,
  CloseReview,
  WeeklyReview,
  PerformanceHistory,
  NewsDigest,
  DashboardSummaryView,
  MorningView,
  FileHealth,
  DataMeta,
} from '../types'

// ============================================================
// Cache-busting fetch — always bypasses browser/CDN cache.
// OpenClaw overwrites files in-place, so we must not cache.
// ============================================================
const BASE_URL = import.meta.env.BASE_URL || '/'

function resolveDataUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
  if (url.startsWith('/')) return `${base}${url.replace(/^\/+/, '')}`
  return `${base}${url.replace(/^\.\//, '')}`
}

function fetchNoCache<T>(url: string): Promise<T> {
  return fetch(resolveDataUrl(url), {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<T>
  })
}

// ============================================================
// Generic hook with FileHealth tracking
// ============================================================
interface UseFileResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  health: FileHealth
}

function useFile<T extends { _meta?: DataMeta }>(
  url: string | null,
  fileKey: string,
  fileLabel: string,
): UseFileResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<DataMeta | null>(null)
  const prevUrl = useRef<string | null>(null)

  useEffect(() => {
    // Clear stale data whenever URL disappears
    if (!url) {
      setData(null)
      setError(null)
      setMeta(null)
      prevUrl.current = null
      return
    }
    // Avoid redundant fetches for same URL
    if (url === prevUrl.current && data !== null) return
    prevUrl.current = url

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchNoCache<T>(url)
      .then((json) => {
        if (cancelled) return
        setData(json)
        setMeta(json._meta ?? null)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setData(null)   // discard stale data on fetch failure
        setMeta(null)
        setError(err.message)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  const health: FileHealth = {
    key: fileKey,
    label: fileLabel,
    path: url,
    fetchStatus: loading ? 'loading' : error ? 'error' : data ? 'ok' : 'idle',
    fetchError: error,
    meta: meta,
    isFallback: meta?.fallback_used ?? false,
  }

  return { data, loading, error, health }
}

// ============================================================
// Latest index — always fetched with no-cache
// ============================================================
export function useLatestIndex() {
  return useFile<LatestIndex>('data/latest.json', 'index', '資料索引')
}

// ============================================================
// Publish-layer views — optional, routed via latest.published_views
// ============================================================
export interface PublishedViewsBundle {
  dashboardSummary: UseFileResult<DashboardSummaryView>
  morningView: UseFileResult<MorningView>
  loading: boolean
}

export function usePublishedViews(publishedViews: LatestIndex['published_views'] | undefined): PublishedViewsBundle {
  const dashboardSummary = useFile<DashboardSummaryView>(
    publishedViews?.dashboard_summary ?? null, 'dashboard_summary', '總覽發佈檔',
  )
  const morningView = useFile<MorningView>(
    publishedViews?.morning_view ?? null, 'morning_view', '盤前頁發佈檔',
  )

  return {
    dashboardSummary,
    morningView,
    loading: dashboardSummary.loading || morningView.loading,
  }
}

// ============================================================
// Daily data bundle — all paths come from latest.paths
// No date-splicing ever happens in this hook.
// ============================================================
export interface DailyDataBundle {
  thesis: UseFileResult<DailyThesis>
  actionPlan: UseFileResult<ActionPlan>
  thesisCheck: UseFileResult<ThesisCheckDoc>
  closeReview: UseFileResult<CloseReview>
  loading: boolean
  healthMap: Record<string, FileHealth>
}

export function useDailyData(paths: LatestIndex['paths'] | null): DailyDataBundle {
  const activeDate = paths?.daily_thesis?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null
  const sameDayThesisCheckPath = activeDate && paths?.thesis_check && !paths.thesis_check.includes(`/${activeDate}/`)
    ? null
    : (paths?.thesis_check ?? null)
  const sameDayCloseReviewPath = activeDate && paths?.close_review && !paths.close_review.includes(`/${activeDate}/`)
    ? null
    : (paths?.close_review ?? null)

  const thesis = useFile<DailyThesis>(
    paths?.daily_thesis ?? null, 'daily_thesis', '盤前分析',
  )
  const actionPlan = useFile<ActionPlan>(
    paths?.action_plan ?? null, 'action_plan', '操作計畫',
  )
  const thesisCheck = useFile<ThesisCheckDoc>(
    sameDayThesisCheckPath, 'thesis_check', '盤中修正',
  )
  const closeReview = useFile<CloseReview>(
    sameDayCloseReviewPath, 'close_review', '收盤檢討',
  )

  const loading =
    thesis.loading || actionPlan.loading ||
    thesisCheck.loading || closeReview.loading

  const healthMap: Record<string, FileHealth> = {
    daily_thesis: thesis.health,
    action_plan:  actionPlan.health,
    thesis_check: thesisCheck.health,
    close_review: closeReview.health,
  }

  return { thesis, actionPlan, thesisCheck, closeReview, loading, healthMap }
}

// ============================================================
// Weekly review — path comes from latest.weekly_paths[week]
// ============================================================
export function useWeeklyReview(
  week: string | null,
  weeklyPaths: Record<string, string> | undefined,
) {
  const url = week && weeklyPaths ? (weeklyPaths[week] ?? null) : null
  return useFile<WeeklyReview>(url, 'weekly_review', '週回顧')
}

// ============================================================
// Performance history — path comes from latest.paths
// ============================================================
export function usePerformanceHistory(path: string | null) {
  return useFile<PerformanceHistory>(path, 'performance_history', '系統績效')
}

// ============================================================
// News digest — path comes from latest.paths
// ============================================================
export function useNewsDigest(path: string | null) {
  return useFile<NewsDigest>(path, 'news_digest', '今日消息')
}

// ============================================================
// Manual refresh trigger — call refresh() to force re-fetch latest.json
// ============================================================
export function useRefreshTrigger() {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])
  return { tick, refresh }
}
