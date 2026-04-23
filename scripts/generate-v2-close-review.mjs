import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const workspaceRoot = '/home/barrysu/.openclaw/workspace'
const publicRoot = path.join(repoRoot, 'public')
const tmpSummaryPath = path.join(workspaceRoot, 'tmp/v2-close-review-generation-latest.json')
const tmpAnalysisPath = path.join(workspaceRoot, 'tmp/v2-analysis-layer-status-latest.json')

function parseArgs(argv) {
  const args = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [key, value] = raw.slice(2).split('=')
    args[key] = value ?? '1'
  }
  return args
}

function taipeiNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const map = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    iso: `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+08:00`,
    label: `${map.hour}:${map.minute}`,
  }
}

function stripCommas(value) {
  return String(value ?? '').replace(/,/g, '')
}

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const cleaned = stripCommas(value).replace(/%/g, '').trim()
  if (!cleaned) return fallback
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : fallback
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

async function readJson(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJson(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'OpenClaw-V2-CloseReview/1.0' },
  })
  if (!response.ok) {
    throw new Error(`fetch ${url} failed: HTTP ${response.status}`)
  }
  return response.json()
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'OpenClaw-V2-CloseReview/1.0' },
  })
  if (!response.ok) {
    throw new Error(`fetch ${url} failed: HTTP ${response.status}`)
  }
  return response.text()
}

function normalizeDirectionBias(input) {
  const value = String(input || '').toLowerCase()
  if (value.includes('bear')) return 'bearish'
  if (value.includes('bull') || value.includes('supportive')) return 'bullish'
  if (value.includes('neutral')) return 'neutral'
  return 'neutral'
}

function actualDirectionFromChange(change) {
  if (change > 0.00001) return 'up'
  if (change < -0.00001) return 'down'
  return 'flat'
}

function directionVerdict(predicted, actual) {
  if (predicted === 'neutral') return actual === 'flat' ? 'correct' : 'partial'
  if (predicted === 'bullish') return actual === 'up' ? 'correct' : actual === 'flat' ? 'partial' : 'incorrect'
  if (predicted === 'bearish') return actual === 'down' ? 'correct' : actual === 'flat' ? 'partial' : 'incorrect'
  return 'partial'
}

function tickerVerdict(predicted, actual) {
  if (predicted === 'long') return actual === 'up' ? 'correct' : actual === 'flat' ? 'partial' : 'incorrect'
  if (predicted === 'short') return actual === 'down' ? 'correct' : actual === 'flat' ? 'partial' : 'incorrect'
  if (predicted === 'avoid') return actual === 'down' ? 'correct' : actual === 'flat' ? 'partial' : 'incorrect'
  if (predicted === 'hold') return 'partial'
  return 'partial'
}

function summarizeActionDirection(action) {
  const direction = String(action?.direction || 'watch')
  if (['long', 'short', 'watch', 'avoid', 'hold'].includes(direction)) return direction
  return 'watch'
}

function scoreReview({ directionVerdictValue, thesisCheckEntries, tickerResults, maxExposurePct }) {
  let score = 55
  if (directionVerdictValue === 'correct') score += 15
  else if (directionVerdictValue === 'partial') score += 6
  else score -= 12

  const correctTickerCalls = tickerResults.filter((r) => r.verdict === 'correct').length
  const incorrectTickerCalls = tickerResults.filter((r) => r.verdict === 'incorrect').length
  score += correctTickerCalls * 5
  score -= incorrectTickerCalls * 4

  if (Array.isArray(thesisCheckEntries) && thesisCheckEntries.length >= 2) score += 6
  if (typeof maxExposurePct === 'number' && maxExposurePct <= 2 && incorrectTickerCalls > correctTickerCalls) score += 4
  if (typeof maxExposurePct === 'number' && maxExposurePct >= 20 && directionVerdictValue === 'incorrect') score -= 8

  return Math.max(15, Math.min(92, Math.round(score)))
}

function collectCandidateTickers(actionPlan, dailyThesis) {
  const candidates = []
  const seen = new Set()

  const pushTicker = (item) => {
    const ticker = String(item?.ticker || '').trim().toUpperCase()
    if (!ticker || ticker === 'CASH' || seen.has(ticker)) return
    seen.add(ticker)
    candidates.push({ ticker, name: item?.name || ticker, predicted_direction: summarizeActionDirection(item) })
  }

  for (const action of actionPlan?.actions || []) pushTicker(action)
  for (const candidate of actionPlan?.trade_candidates || []) pushTicker(candidate)
  for (const candidate of dailyThesis?.candidate_pool || []) pushTicker(candidate)

  if (candidates.length === 0 && dailyThesis?.watchlist) {
    for (const watch of dailyThesis.watchlist.slice(0, 4)) pushTicker(watch)
  }

  return candidates.slice(0, 5)
}

function parseTwseAfterTrading(data) {
  const result = {
    taiexClose: 0,
    taiexChange: 0,
    taiexChangePct: 0,
    taiexTradeValue: 0,
    quoteMap: new Map(),
  }

  for (const table of data?.tables || []) {
    for (const row of table?.data || []) {
      if (row?.[0] === 'TAIEX') {
        result.taiexClose = toNumber(row[1])
        result.taiexChange = toNumber(row[2])
        result.taiexChangePct = toNumber(row[3])
        result.taiexTradeValue = toNumber(row[5] ?? row[row.length - 1])
      }

      if (row?.[0] && /^\d{4}[A-Z]?$/.test(String(row[0]).trim())) {
        const ticker = String(row[0]).trim().toUpperCase()
        const name = row[1] ?? ticker
        const open = toNumber(row[2], NaN)
        const high = toNumber(row[3], NaN)
        const low = toNumber(row[4], NaN)
        const close = toNumber(row[5], NaN)
        const rawChange = toNumber(row[6], NaN)
        const rawPct = toNumber(row[7], NaN)
        const previousClose = Number.isFinite(close) && Number.isFinite(rawChange) ? close - rawChange : NaN
        result.quoteMap.set(ticker, {
          ticker,
          name,
          open,
          high,
          low,
          close,
          previousClose,
          changePct: rawPct,
        })
      }
    }
  }

  return result
}

async function fetchYahooQuote(ticker) {
  const suffixes = ['.TW', '.TWO']
  for (const suffix of suffixes) {
    try {
      const html = await fetchText(`https://tw.stock.yahoo.com/quote/${ticker}${suffix}`)
      const priceMatch = html.match(/"regularMarketPrice":([0-9.]+)/)
      const prevMatch = html.match(/"previousClose":([0-9.]+)/)
      const nameMatch = html.match(/"title":"([^"|]+?)\s*\|/) || html.match(/<title>([^<|]+?)\s*\|/)
      if (!priceMatch || !prevMatch) continue
      const close = Number(priceMatch[1])
      const previousClose = Number(prevMatch[1])
      const changePct = previousClose ? ((close - previousClose) / previousClose) * 100 : 0
      return {
        ticker,
        name: nameMatch?.[1]?.trim() || ticker,
        close,
        previousClose,
        changePct,
      }
    } catch {
      // try next suffix
    }
  }
  return null
}

async function getQuote(ticker, twseParsed) {
  const fromTwse = twseParsed.quoteMap.get(ticker)
  if (fromTwse && Number.isFinite(fromTwse.close) && Number.isFinite(fromTwse.previousClose)) {
    return fromTwse
  }
  const yahoo = await fetchYahooQuote(ticker)
  if (yahoo) return yahoo
  return null
}

function deriveParticipationMode(lastEntry) {
  const value = String(lastEntry?.participation_mode || '').trim()
  return value || 'unknown'
}

function deriveDriverStatus(lastEntry, actionPlan) {
  return String(lastEntry?.driver_status || actionPlan?.driver_based_action_hint?.driver_status || 'unknown')
}

function makeCloseReview({
  date,
  generatedAt,
  dailyThesis,
  actionPlan,
  thesisCheck,
  newsDigest,
  twseParsed,
  tickerResults,
}) {
  const predictedDirection = normalizeDirectionBias(dailyThesis?.direction_bias)
  const actualDirection = actualDirectionFromChange(twseParsed.taiexChange)
  const verdict = directionVerdict(predictedDirection, actualDirection)
  const thesisCheckEntries = thesisCheck?.entries || []
  const lastEntry = thesisCheckEntries[thesisCheckEntries.length - 1] || null
  const middleEntry = thesisCheckEntries[Math.max(0, thesisCheckEntries.length - 2)] || null
  const maxExposurePct = actionPlan?.max_exposure_pct ?? actionPlan?.max_exposure?.pct ?? 0
  const accuracyScore = scoreReview({
    directionVerdictValue: verdict,
    thesisCheckEntries,
    tickerResults,
    maxExposurePct: typeof maxExposurePct === 'number' ? maxExposurePct : 0,
  })

  const routeByBreadthFailure = tickerResults.filter((r) => r.actual_direction === 'down').length >= Math.max(2, Math.ceil(tickerResults.length / 2))
  const oneStrongIndexAnchor = tickerResults.some((r) => r.ticker === '2330' && r.actual_direction === 'up')
  const participationMode = deriveParticipationMode(lastEntry)
  const driverStatus = deriveDriverStatus(lastEntry, actionPlan)
  const marketDriverText = typeof dailyThesis?.market_driver_summary === 'string'
    ? dailyThesis.market_driver_summary
    : (dailyThesis?.market_driver_summary?.why_it_matters || dailyThesis?.headline || '主導消息摘要不足')

  const whatWorked = []
  if (Array.isArray(thesisCheckEntries) && thesisCheckEntries.length >= 2) {
    whatWorked.push(`盤中 decision gates 有落到實際風控用途：共 ${thesisCheckEntries.length} 次 thesis_check，沒有把早盤印象硬撐到收盤。`)
  }
  if (typeof maxExposurePct === 'number' && maxExposurePct <= 2) {
    whatWorked.push(`操作層維持低曝險（上限 ${maxExposurePct}%）或乾脆回到現金，使錯誤前提沒有被擴大成部位風險。`)
  }
  if (routeByBreadthFailure) {
    whatWorked.push('候選股 / 容器型 ETF 的強弱有被拿來驗證市場廣度，沒有只看指數表面漲跌。')
  }
  if (whatWorked.length === 0) {
    whatWorked.push('本輪至少有把盤前框架、盤中修正與收盤驗證串起來，沒有直接跳過反省層。')
  }

  const whatFailed = []
  if (verdict !== 'correct') {
    whatFailed.push(`盤前方向框架未完全命中：預測偏 ${predictedDirection === 'bullish' ? '多' : predictedDirection === 'bearish' ? '空' : '中性'}，但收盤實際為 ${actualDirection === 'up' ? '上漲' : actualDirection === 'down' ? '下跌' : '平盤'}。`)
  }
  if (oneStrongIndexAnchor && routeByBreadthFailure) {
    whatFailed.push('對「權值支撐 ≠ 全市場可交易擴散」的辨識仍可再提前，尤其當少數權值與多數候選同步背離時。')
  }
  if (String(driverStatus).includes('unknown') || String(participationMode).includes('unknown')) {
    whatFailed.push('盤中 driver / participation 記錄仍有資訊密度不足的段落，影響收盤回顧的證據鏈完整度。')
  }
  if (whatFailed.length === 0) {
    whatFailed.push('今日沒有明顯結構性錯誤，但仍需防止把單日結果過度外推成新常態。')
  }

  const keyLearning = oneStrongIndexAnchor && routeByBreadthFailure
    ? '今天最重要的教訓是：少數權值能撐住指數，不代表整個可交易候選池就健康。之後遇到開高或指數表面不弱時，要更快區分是 core-proxy confirmation、還是只有 index-level support。'
    : `今天的收盤重點是 ${marketDriverText}；真正該記住的不是 headline 本身，而是市場最後有沒有把它轉成可延續的參與度與承接。`

  const biasObserved = []
  if (predictedDirection === 'bullish' && actualDirection === 'down') {
    biasObserved.push('延續偏差：容易把前一輪支撐結構外推到隔日 / 當日後段。')
  }
  if (routeByBreadthFailure) {
    biasObserved.push('指數錨定偏差：若只看 TAIEX 或少數大權值，會低估候選池同步轉弱的訊號。')
  }
  if (String(driverStatus).includes('reversed')) {
    biasObserved.push('消息錨定偏差：主導消息一開始成立，不代表全天都還有效。')
  }

  const tomorrowWatchpoints = []
  tomorrowWatchpoints.push(`先檢查今日收盤後延續到明天盤前的主導脈絡是否仍為：${String(driverStatus) !== 'unknown' ? driverStatus : '需重判'}。`)
  if (tickerResults.length > 0) {
    const weakTickers = tickerResults.filter((r) => r.actual_direction === 'down').slice(0, 3).map((r) => r.ticker)
    const strongTickers = tickerResults.filter((r) => r.actual_direction === 'up').slice(0, 2).map((r) => r.ticker)
    if (weakTickers.length > 0) tomorrowWatchpoints.push(`優先確認 ${weakTickers.join(' / ')} 是止跌修復，還是代表弱勢主線仍未結束。`)
    if (strongTickers.length > 0) tomorrowWatchpoints.push(`若 ${strongTickers.join(' / ')} 仍相對抗跌，也要分辨它們是在帶動修復，還是只剩少數支撐。`)
  }
  tomorrowWatchpoints.push('若盤前只能得到 headline，仍需等開盤後的 participation / breadth 驗證，不要把 overnight 敘事直接翻成可追價腳本。')

  return {
    _meta: {
      schema_version: '1.1',
      job_name: 'openclaw.close_review',
      data_type: 'close',
      status: 'success',
      generated_at_iso: generatedAt.iso,
      generated_at_label: generatedAt.label,
      source_freshness: 'verified',
      warnings: [
        'deterministic_close_review_generator',
        'twse_after_trading_used_for_index_and_listed_quotes',
        'yahoo_quote_fallback_used_for_non_twse_symbols_when_needed',
      ],
      fallback_used: false,
    },
    date,
    generated_at_iso: generatedAt.iso,
    generated_at_label: generatedAt.label,
    taiex_close: Number(twseParsed.taiexClose.toFixed(2)),
    taiex_change: Number(twseParsed.taiexChange.toFixed(2)),
    taiex_change_pct: Number(twseParsed.taiexChangePct.toFixed(2)),
    taiex_volume: Math.round(twseParsed.taiexTradeValue || 0),
    predicted_direction: predictedDirection,
    predicted_confidence: Number((dailyThesis?.confidence ?? 0.55).toFixed(2)),
    actual_direction: actualDirection,
    direction_verdict: verdict,
    thesis_accuracy_score: accuracyScore,
    ticker_results: tickerResults,
    what_worked: whatWorked.slice(0, 4),
    what_failed: whatFailed.slice(0, 4),
    key_learning: keyLearning,
    bias_observed: biasObserved.slice(0, 4),
    tomorrow_watchpoints: tomorrowWatchpoints.slice(0, 4),
    paper_trade_today_pnl: Number(actionPlan?.paper_trade?.today_pnl || 0),
    analysis_layer_status: {
      assessment: routeByBreadthFailure || verdict !== 'correct' || thesisCheckEntries.length >= 3 ? 'busy' : 'steady',
      why: routeByBreadthFailure
        ? '今日盤勢存在方向與廣度分化，且盤中修正次數偏多，明天盤前宜沿用較保守的 guardrail。'
        : '今日收盤訊號相對單純，分析層負載未明顯超標。',
      signal_count: Array.isArray(newsDigest?.headlines) ? newsDigest.headlines.length : 0,
      driver_count: Array.isArray(dailyThesis?.candidate_pool) ? dailyThesis.candidate_pool.length : tickerResults.length,
      thesis_check_entry_count: thesisCheckEntries.length,
      overload_signals: [
        routeByBreadthFailure ? '候選池多數收弱，廣度承接不足' : '廣度未出現嚴重同步失真',
        oneStrongIndexAnchor && routeByBreadthFailure ? '少數權值與多數候選背離' : '權值與候選背離不明顯',
        thesisCheckEntries.length >= 3 ? '同日盤中修正次數偏多' : '盤中修正次數可控',
      ],
      guardrails_for_tomorrow: [
        '先判斷是權值支撐、廣度修復，還是只有表面指數穩定。',
        '若沒有新的單一 driver 收斂，預設維持保守曝險。',
        '保留 thesis_check decision gates，不用更多回合堆疊語義。',
      ],
    },
  }
}

function buildAnalysisTmp({ closeReview, thesisCheckEntries }) {
  return {
    checked_at: closeReview.generated_at_iso,
    date: closeReview.date,
    assessment: closeReview.analysis_layer_status.assessment,
    signal_count: closeReview.analysis_layer_status.signal_count,
    driver_count: closeReview.analysis_layer_status.driver_count,
    thesis_check_entry_count: thesisCheckEntries.length,
    overload_signals: closeReview.analysis_layer_status.overload_signals,
    recommended_guardrails: closeReview.analysis_layer_status.guardrails_for_tomorrow,
    notes: 'Updated by deterministic close-review generator from same-day daily_thesis, action_plan, thesis_check, and verified close quotes.',
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const now = taipeiNowParts()
  const date = args.date || now.date
  const dayDir = path.join(publicRoot, 'data/daily', date)
  const closeReviewPath = path.join(dayDir, 'close_review.json')
  const dailyThesisPath = path.join(dayDir, 'daily_thesis.json')
  const actionPlanPath = path.join(dayDir, 'action_plan.json')
  const thesisCheckPath = path.join(dayDir, 'thesis_check.json')
  const newsDigestPath = path.join(publicRoot, 'data/news', date, 'news_digest.json')

  const dailyThesis = await readJson(dailyThesisPath)
  const actionPlan = await readJson(actionPlanPath)
  const thesisCheck = await readJson(thesisCheckPath, { entries: [] })
  const newsDigest = await readJson(newsDigestPath, {})

  const generatedAt = taipeiNowParts()

  if (!dailyThesis || !actionPlan) {
    const errorReview = {
      _meta: {
        schema_version: '1.1',
        job_name: 'openclaw.close_review',
        data_type: 'close',
        status: 'error',
        generated_at_iso: generatedAt.iso,
        generated_at_label: generatedAt.label,
        source_freshness: 'missing',
        warnings: ['daily_thesis_or_action_plan_missing_for_same_day_close_review'],
        fallback_used: false,
      },
      date,
      generated_at_iso: generatedAt.iso,
      generated_at_label: generatedAt.label,
      taiex_close: 0,
      taiex_change: 0,
      taiex_change_pct: 0,
      taiex_volume: 0,
      predicted_direction: 'neutral',
      predicted_confidence: 0,
      actual_direction: 'flat',
      direction_verdict: 'pending',
      thesis_accuracy_score: 0,
      ticker_results: [],
      what_worked: [],
      what_failed: ['same-day daily_thesis.json or action_plan.json missing, close review stopped deterministically'],
      key_learning: '上游核心輸入缺失，需先修復盤前 / 盤中鏈再談收盤反省。',
      bias_observed: [],
      tomorrow_watchpoints: ['先確保 same-day daily_thesis 與 action_plan 正常產出。'],
      paper_trade_today_pnl: 0,
    }
    await writeJson(closeReviewPath, errorReview)
    await writeJson(tmpSummaryPath, {
      checked_at: generatedAt.iso,
      date,
      status: 'error',
      reason: 'daily_thesis_or_action_plan_missing',
      close_review_path: closeReviewPath,
    })
    throw new Error('same-day daily_thesis.json or action_plan.json missing')
  }

  const twseDate = date.replace(/-/g, '')
  const twseUrl = `https://www.twse.com.tw/rwd/en/afterTrading/MI_INDEX?date=${twseDate}&type=ALLBUT0999&response=json`
  const twseJson = await fetchJson(twseUrl)
  const twseParsed = parseTwseAfterTrading(twseJson)

  if (!Number.isFinite(twseParsed.taiexClose) || twseParsed.taiexClose <= 0) {
    throw new Error(`failed to parse TAIEX close from ${twseUrl}`)
  }

  const candidates = collectCandidateTickers(actionPlan, dailyThesis)
  const tickerResults = []
  for (const candidate of candidates) {
    const quote = await getQuote(candidate.ticker, twseParsed)
    if (!quote || !Number.isFinite(quote.close) || !Number.isFinite(quote.previousClose)) continue
    const changePct = Number((quote.changePct ?? ((quote.close - quote.previousClose) / quote.previousClose) * 100).toFixed(2))
    const actualDirection = actualDirectionFromChange(changePct)
    tickerResults.push({
      ticker: candidate.ticker,
      name: quote.name || candidate.name,
      predicted_direction: candidate.predicted_direction,
      actual_direction: actualDirection,
      change_pct: changePct,
      verdict: tickerVerdict(candidate.predicted_direction, actualDirection),
      paper_trade_result: null,
      notes: `${candidate.name} 收盤 ${Number(quote.close).toFixed(2)}，前收 ${Number(quote.previousClose).toFixed(2)}，${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%。以當日 action / 候選角色做驗證，不把收盤後描述反推成新進場理由。`,
    })
  }

  const closeReview = makeCloseReview({
    date,
    generatedAt,
    dailyThesis,
    actionPlan,
    thesisCheck,
    newsDigest,
    twseParsed,
    tickerResults,
  })

  const analysisTmp = buildAnalysisTmp({ closeReview, thesisCheckEntries: thesisCheck?.entries || [] })

  await writeJson(closeReviewPath, closeReview)
  await writeJson(tmpAnalysisPath, analysisTmp)
  await writeJson(tmpSummaryPath, {
    checked_at: generatedAt.iso,
    date,
    status: 'success',
    close_review_path: closeReviewPath,
    taiex_close: closeReview.taiex_close,
    direction_verdict: closeReview.direction_verdict,
    thesis_accuracy_score: closeReview.thesis_accuracy_score,
    assessment: analysisTmp.assessment,
    ticker_count: tickerResults.length,
  })

  console.log(JSON.stringify({
    status: 'success',
    date,
    close_review_path: closeReviewPath,
    taiex_close: closeReview.taiex_close,
    direction_verdict: closeReview.direction_verdict,
    thesis_accuracy_score: closeReview.thesis_accuracy_score,
    assessment: analysisTmp.assessment,
    ticker_count: tickerResults.length,
  }, null, 2))
}

main().catch(async (error) => {
  const generatedAt = taipeiNowParts()
  await writeJson(tmpSummaryPath, {
    checked_at: generatedAt.iso,
    date: parseArgs(process.argv.slice(2)).date || generatedAt.date,
    status: 'error',
    reason: String(error?.message || error),
  })
  console.error(error)
  process.exit(2)
})
