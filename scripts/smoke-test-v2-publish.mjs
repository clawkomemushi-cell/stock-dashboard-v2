import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const publicRoot = path.join(repoRoot, 'public')
const workspaceRoot = '/home/barrysu/.openclaw/workspace'
const publicBase = 'https://clawkomemushi-cell.github.io/stock-dashboard-v2'
const tmpOutput = path.join(workspaceRoot, 'tmp/v2-publish-smoke-latest.json')
const routingMarker = 'github-pages-spa-hash-redirect'

function parseArgs(argv) {
  const args = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [key, value] = raw.slice(2).split('=')
    args[key] = value ?? '1'
  }
  return args
}

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
    headers: { 'user-agent': 'OpenClaw-V2-SmokeTest/1.0' },
  })
  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requiredKeysForMode(mode) {
  const base = ['dashboard_summary', 'morning_view', 'daily_thesis', 'action_plan', 'news_digest']
  if (mode === 'intraday') return [...base, 'thesis_check']
  if (mode === 'close') return [...base, 'close_review']
  return base
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const mode = args.mode || 'morning'
  const requireDate = args.date || null
  const requireMarketStatus = args.marketStatus || null
  const waitPublicMs = Number(args.waitPublicMs || 0)
  const pollMs = Number(args.pollMs || 5000)

  let severity = 'ok'
  const issues = []
  const latestPath = path.join(publicRoot, 'data/latest.json')
  const latest = JSON.parse(await readFile(latestPath, 'utf8'))

  const localDate = latest.date || latest._meta?.generated_at_iso?.slice(0, 10) || null
  const localGeneratedAt = latest._meta?.generated_at_iso || null
  const localMarketStatus = latest.market_status || null

  if (requireDate && localDate !== requireDate) {
    severity = escalate(severity, 'error')
    issues.push(`local latest date mismatch: expected=${requireDate} actual=${localDate}`)
  }

  if (requireMarketStatus && localMarketStatus !== requireMarketStatus) {
    severity = escalate(severity, 'error')
    issues.push(`local latest market_status mismatch: expected=${requireMarketStatus} actual=${localMarketStatus}`)
  }

  const publishedViews = latest.published_views || {}
  const pathMap = latest.paths || {}
  const allFiles = {
    dashboard_summary: publishedViews.dashboard_summary,
    morning_view: publishedViews.morning_view,
    daily_thesis: pathMap.daily_thesis,
    action_plan: pathMap.action_plan,
    news_digest: pathMap.news_digest,
    thesis_check: pathMap.thesis_check,
    close_review: pathMap.close_review,
  }

  const requiredKeys = requiredKeysForMode(mode)
  const localFileChecks = {}
  for (const [key, relPath] of Object.entries(allFiles)) {
    const absolute = resolvePublicDataPath(relPath)
    const exists = Boolean(absolute && existsSync(absolute))
    localFileChecks[key] = { path: relPath || null, exists, required: requiredKeys.includes(key) }
    if (requiredKeys.includes(key) && !exists) {
      severity = escalate(severity, 'error')
      issues.push(`missing required local file for ${key}: ${relPath || 'null'}`)
    }
  }

  const localIndexHasMarker = (await readFile(path.join(repoRoot, 'index.html'), 'utf8')).includes(routingMarker)
  const workflowCopies404 = (await readFile(path.join(repoRoot, '.github/workflows/deploy-pages.yml'), 'utf8')).includes('cp dist/index.html dist/404.html')
  const routeFallbackLocalOk = localIndexHasMarker && workflowCopies404
  if (!routeFallbackLocalOk) {
    severity = escalate(severity, 'error')
    issues.push('local route fallback wiring missing')
  }

  let publicLatestResult = await fetchText(`${publicBase}/data/latest.json`)
  let public404Result = await fetchText(`${publicBase}/404.html`)
  let publicLatest = null
  let publicFileChecks = {}

  async function evaluatePublic() {
    publicLatestResult = await fetchText(`${publicBase}/data/latest.json`)
    public404Result = await fetchText(`${publicBase}/404.html`)
    if (!publicLatestResult.ok) {
      return {
        publicDate: null,
        publicGeneratedAt: null,
        publicMarketStatus: null,
        publicRouteFallbackOk: public404Result.ok && public404Result.text.includes(routingMarker),
        ready: false,
      }
    }

    try {
      publicLatest = JSON.parse(publicLatestResult.text)
    } catch {
      return {
        publicDate: null,
        publicGeneratedAt: null,
        publicMarketStatus: null,
        publicRouteFallbackOk: public404Result.ok && public404Result.text.includes(routingMarker),
        ready: false,
      }
    }

    publicFileChecks = {}
    let publicFilesReady = true
    for (const key of requiredKeys) {
      const relPath = key.startsWith('dashboard') || key === 'morning_view'
        ? publicLatest?.published_views?.[key]
        : publicLatest?.paths?.[key]
      if (!relPath) {
        publicFilesReady = false
        publicFileChecks[key] = { path: null, ok: false, status: 0 }
        continue
      }
      const response = await fetchText(`${publicBase}/${stripLeadingSlash(relPath)}`)
      publicFileChecks[key] = { path: relPath, ok: response.ok, status: response.status }
      if (!response.ok) publicFilesReady = false
    }

    const publicDate = publicLatest?.date || publicLatest?._meta?.generated_at_iso?.slice(0, 10) || null
    const publicGeneratedAt = publicLatest?._meta?.generated_at_iso || null
    const publicMarketStatus = publicLatest?.market_status || null
    const publicRouteFallbackOk = public404Result.ok && public404Result.text.includes(routingMarker)

    const dateOk = !requireDate || publicDate === requireDate
    const marketStatusOk = !requireMarketStatus || publicMarketStatus === requireMarketStatus
    const generatedAtOk = !localGeneratedAt || publicGeneratedAt === localGeneratedAt

    return {
      publicDate,
      publicGeneratedAt,
      publicMarketStatus,
      publicRouteFallbackOk,
      ready: dateOk && marketStatusOk && generatedAtOk && publicFilesReady && publicRouteFallbackOk,
      publicFilesReady,
      dateOk,
      marketStatusOk,
      generatedAtOk,
    }
  }

  let publicEval = await evaluatePublic()
  const deadline = Date.now() + waitPublicMs
  while (waitPublicMs > 0 && !publicEval.ready && Date.now() < deadline) {
    await sleep(pollMs)
    publicEval = await evaluatePublic()
  }

  const publicLatestOk = publicLatestResult.ok
  const publicSiteOk = (await fetchText(`${publicBase}/`)).ok
  const publicRouteFallbackOk = publicEval.publicRouteFallbackOk

  if (!publicSiteOk) {
    severity = escalate(severity, 'error')
    issues.push('public site root unavailable')
  }
  if (!publicLatestOk) {
    severity = escalate(severity, 'warning')
    issues.push(`public latest.json unavailable: status ${publicLatestResult.status}`)
  }
  if (!publicRouteFallbackOk) {
    severity = escalate(severity, 'warning')
    issues.push('public route fallback missing or stale')
  }
  if (requireDate && publicLatestOk && publicEval.publicDate !== requireDate) {
    severity = escalate(severity, waitPublicMs > 0 ? 'warning' : 'warning')
    issues.push(`public latest date mismatch: expected=${requireDate} actual=${publicEval.publicDate}`)
  }
  if (requireMarketStatus && publicLatestOk && publicEval.publicMarketStatus !== requireMarketStatus) {
    severity = escalate(severity, 'warning')
    issues.push(`public latest market_status mismatch: expected=${requireMarketStatus} actual=${publicEval.publicMarketStatus}`)
  }
  if (publicLatestOk && localGeneratedAt && publicEval.publicGeneratedAt !== localGeneratedAt) {
    severity = escalate(severity, 'warning')
    issues.push(`public latest generated_at differs: local=${localGeneratedAt} public=${publicEval.publicGeneratedAt}`)
  }
  if (Object.keys(publicFileChecks).length > 0) {
    for (const [key, info] of Object.entries(publicFileChecks)) {
      if (!info.ok) {
        severity = escalate(severity, 'warning')
        issues.push(`public required file not ready for ${key}: status=${info.status}`)
      }
    }
  }

  const result = {
    checked_at: toIsoTaipei(),
    mode,
    require_date: requireDate,
    require_market_status: requireMarketStatus,
    local_latest_date: localDate,
    local_generated_at_iso: localGeneratedAt,
    local_market_status: localMarketStatus,
    public_latest_date: publicEval.publicDate || null,
    public_generated_at_iso: publicEval.publicGeneratedAt || null,
    public_market_status: publicEval.publicMarketStatus || null,
    route_fallback_local_ok: routeFallbackLocalOk,
    route_fallback_public_ok: publicRouteFallbackOk,
    local_file_checks: localFileChecks,
    public_file_checks: publicFileChecks,
    public_site_ok: publicSiteOk,
    public_latest_ok: publicLatestOk,
    issues,
    severity,
  }

  await writeFile(tmpOutput, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify(result, null, 2))

  if (severity === 'error') process.exit(2)
}

main().catch(async (error) => {
  const result = {
    checked_at: toIsoTaipei(),
    severity: 'error',
    issues: [String(error?.message || error)],
  }
  await writeFile(tmpOutput, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.error(error)
  process.exit(2)
})
