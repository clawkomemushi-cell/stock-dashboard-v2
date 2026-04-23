import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const publicRoot = path.join(repoRoot, 'public')
const tmpOutput = '/home/barrysu/.openclaw/workspace/tmp/v2-data-health-check-latest.json'
const publicBase = 'https://clawkomemushi-cell.github.io/stock-dashboard-v2'
const routingMarker = 'github-pages-spa-hash-redirect'

function toIsoTaipei(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date).replace(' ', 'T') + '+08:00'
}

function stripLeadingSlash(value) {
  return String(value || '').replace(/^\//, '')
}

function resolvePublicDataPath(relPath) {
  if (!relPath) return null
  return path.join(publicRoot, stripLeadingSlash(relPath))
}

function severityRank(severity) {
  return severity === 'error' ? 2 : severity === 'warning' ? 1 : 0
}

function escalate(current, next) {
  return severityRank(next) > severityRank(current) ? next : current
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'OpenClaw-V2-HealthCheck/1.0' },
  })
  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
  }
}

async function main() {
  let severity = 'ok'
  const issues = []

  const latestPath = path.join(publicRoot, 'data/latest.json')
  const latestRaw = await readFile(latestPath, 'utf8')
  const latest = JSON.parse(latestRaw)

  const localLatestDate = latest.date || latest._meta?.generated_at_iso?.slice(0, 10) || null
  const localGeneratedAt = latest._meta?.generated_at_iso || null
  const localLatestOk = Boolean(localGeneratedAt)

  if (!localLatestOk) {
    severity = escalate(severity, 'error')
    issues.push('local latest.json missing generated_at metadata')
  }

  const publishedViews = latest.published_views || {}
  const pathMap = latest.paths || {}

  const requiredFiles = {
    dashboard_summary: publishedViews.dashboard_summary,
    morning_view: publishedViews.morning_view,
    daily_thesis: pathMap.daily_thesis,
    action_plan: pathMap.action_plan,
    news_digest: pathMap.news_digest,
    close_review: pathMap.close_review,
  }

  const optionalFiles = {
    thesis_check: pathMap.thesis_check,
    weekly_review: pathMap.weekly_review,
    performance_history: pathMap.performance_history,
  }

  const fileChecks = {}
  for (const [key, relPath] of Object.entries(requiredFiles)) {
    const absolute = resolvePublicDataPath(relPath)
    const exists = Boolean(absolute && existsSync(absolute))
    fileChecks[key] = { path: relPath || null, exists, required: true }
    if (!exists) {
      severity = escalate(severity, 'error')
      issues.push(`missing required local file for ${key}: ${relPath || 'null'}`)
    }
  }

  for (const [key, relPath] of Object.entries(optionalFiles)) {
    const absolute = resolvePublicDataPath(relPath)
    const exists = Boolean(absolute && existsSync(absolute))
    fileChecks[key] = { path: relPath || null, exists, required: false }
  }

  const localIndexPath = path.join(repoRoot, 'index.html')
  const workflowPath = path.join(repoRoot, '.github/workflows/deploy-pages.yml')
  const localIndexHasMarker = existsSync(localIndexPath)
    && (await readFile(localIndexPath, 'utf8')).includes(routingMarker)
  const workflowCopies404 = existsSync(workflowPath)
    && (await readFile(workflowPath, 'utf8')).includes('cp dist/index.html dist/404.html')
  const routeFallbackLocalOk = localIndexHasMarker && workflowCopies404

  if (!routeFallbackLocalOk) {
    severity = escalate(severity, 'error')
    issues.push('local route fallback wiring missing: index marker or deploy copy step not found')
  }

  const publicRootResult = await fetchText(`${publicBase}/`)
  const publicLatestResult = await fetchText(`${publicBase}/data/latest.json`)
  const public404Result = await fetchText(`${publicBase}/404.html`)

  const publicSiteOk = publicRootResult.ok
  const publicLatestOk = publicLatestResult.ok
  const publicRouteFallbackOk = public404Result.ok && public404Result.text.includes(routingMarker)

  if (!publicSiteOk) {
    severity = escalate(severity, 'error')
    issues.push(`public site unavailable: status ${publicRootResult.status}`)
  }

  if (!publicLatestOk) {
    severity = escalate(severity, 'error')
    issues.push(`public latest.json unavailable: status ${publicLatestResult.status}`)
  }

  if (!publicRouteFallbackOk) {
    severity = escalate(severity, 'warning')
    issues.push('public 404.html fallback missing or stale; direct deep links may break')
  }

  let publicLatest = null
  if (publicLatestOk) {
    try {
      publicLatest = JSON.parse(publicLatestResult.text)
    } catch {
      severity = escalate(severity, 'error')
      issues.push('public latest.json is not valid JSON')
    }
  }

  const publicLatestDate = publicLatest?.date || publicLatest?._meta?.generated_at_iso?.slice(0, 10) || null
  const publicGeneratedAt = publicLatest?._meta?.generated_at_iso || null
  const dateMatch = Boolean(localLatestDate && publicLatestDate && localLatestDate === publicLatestDate)
  const generatedAtMatch = Boolean(localGeneratedAt && publicGeneratedAt && localGeneratedAt === publicGeneratedAt)

  if (publicLatest && !dateMatch) {
    severity = escalate(severity, 'warning')
    issues.push(`public latest date mismatch: local=${localLatestDate} public=${publicLatestDate}`)
  }

  if (publicLatest && dateMatch && !generatedAtMatch) {
    severity = escalate(severity, 'warning')
    issues.push(`public latest generated_at differs: local=${localGeneratedAt} public=${publicGeneratedAt}`)
  }

  const pageRoutes = {
    dashboard: `${publicBase}/#/`,
    morning: `${publicBase}/#/morning`,
    news: `${publicBase}/#/news`,
    intraday: `${publicBase}/#/intraday`,
    close: `${publicBase}/#/close`,
    weekly: `${publicBase}/#/weekly`,
    performance: `${publicBase}/#/performance`,
  }

  const pageDataHealth = {
    dashboard: fileChecks.dashboard_summary.exists && fileChecks.daily_thesis.exists && fileChecks.action_plan.exists,
    morning: fileChecks.morning_view.exists || fileChecks.daily_thesis.exists,
    news: fileChecks.news_digest.exists,
    intraday: fileChecks.action_plan.exists,
    close: fileChecks.close_review.exists,
    weekly: fileChecks.weekly_review.exists,
    performance: fileChecks.performance_history.exists,
  }

  const viewFilesOk = fileChecks.dashboard_summary.exists && fileChecks.morning_view.exists
  if (!viewFilesOk) {
    severity = escalate(severity, 'error')
    issues.push('published view files missing locally')
  }

  const result = {
    checked_at: toIsoTaipei(),
    local_latest_ok: localLatestOk,
    public_site_ok: publicSiteOk,
    public_latest_ok: publicLatestOk,
    date_match: dateMatch,
    generated_at_match: generatedAtMatch,
    view_files_ok: viewFilesOk,
    route_fallback_local_ok: routeFallbackLocalOk,
    route_fallback_public_ok: publicRouteFallbackOk,
    routing_mode: 'hash_router_with_404_redirect',
    local_latest_date: localLatestDate,
    public_latest_date: publicLatestDate,
    local_generated_at_iso: localGeneratedAt,
    public_generated_at_iso: publicGeneratedAt,
    page_routes: pageRoutes,
    page_data_health: pageDataHealth,
    file_checks: fileChecks,
    issues,
    severity,
  }

  await writeFile(tmpOutput, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify(result, null, 2))

  if (severity === 'error') {
    process.exitCode = 2
  }
}

main().catch(async (error) => {
  const result = {
    checked_at: toIsoTaipei(),
    local_latest_ok: false,
    public_site_ok: false,
    public_latest_ok: false,
    date_match: false,
    view_files_ok: false,
    route_fallback_local_ok: false,
    route_fallback_public_ok: false,
    routing_mode: 'hash_router_with_404_redirect',
    issues: [String(error?.message || error)],
    severity: 'error',
  }

  await writeFile(tmpOutput, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.error(error)
  process.exit(2)
})
