import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { MorningAnalysis } from './pages/MorningAnalysis'
import { Intraday } from './pages/Intraday'
import { PaperTrade } from './pages/PaperTrade'
import { CloseReview } from './pages/CloseReview'
import { WeeklyReview } from './pages/WeeklyReview'
import { SystemStats } from './pages/SystemStats'
import { useLatestIndex, useDailyData, usePerformanceHistory } from './hooks/useDataLoader'
import type { FileHealth } from './types'

function AppRoutes() {
  const latest = useLatestIndex()
  const paths = latest.data?.paths ?? null

  // All daily data fetched via paths from latest.json — no manual path construction
  const daily = useDailyData(paths)

  // Performance history hoisted here so its health is tracked in the shared healthMap
  const performance = usePerformanceHistory(paths?.performance_history ?? null)

  const loading = latest.loading || daily.loading

  // Derive weekly_review fetchStatus from latest.file_statuses (OpenClaw-reported)
  // Full frontend fetch health is tracked inside WeeklyReview page for the selected week
  const weeklyFileStatus = latest.data?.file_statuses?.weekly_review
  const weeklyFetchStatus: FileHealth['fetchStatus'] =
    weeklyFileStatus?.status === 'success' ? 'ok' :
    weeklyFileStatus?.status === 'failed'  ? 'error' : 'idle'

  // Merge all FileHealths for the DataHealthPanel
  const healthMap = {
    ...daily.healthMap,
    weekly_review: {
      key: 'weekly_review',
      label: '週回顧',
      path: paths?.weekly_review ?? null,
      fetchStatus: weeklyFetchStatus,
      fetchError: null,
      meta: null,
      isFallback: false,
    },
    performance_history: performance.health,
  }

  return (
    <Layout
      latest={latest.data}
      latestError={latest.error}
      healthMap={healthMap}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              thesis={daily.thesis.data}
              actionPlan={daily.actionPlan.data}
              thesisCheck={daily.thesisCheck.data}
              loading={loading}
              error={latest.error ?? daily.thesis.error ?? daily.actionPlan.error}
              healthMap={healthMap}
            />
          }
        />
        <Route
          path="/morning"
          element={
            <MorningAnalysis
              thesis={daily.thesis.data}
              loading={loading}
              error={daily.thesis.error}
            />
          }
        />
        <Route
          path="/intraday"
          element={
            <Intraday
              thesisCheck={daily.thesisCheck.data}
              actionPlan={daily.actionPlan.data}
              loading={loading}
              error={daily.thesisCheck.error}
            />
          }
        />
        <Route
          path="/trade"
          element={
            <PaperTrade
              actionPlan={daily.actionPlan.data}
              loading={loading}
              error={daily.actionPlan.error}
            />
          }
        />
        <Route
          path="/paper-trade"
          element={
            <PaperTrade
              actionPlan={daily.actionPlan.data}
              loading={loading}
              error={daily.actionPlan.error}
            />
          }
        />
        <Route
          path="/close"
          element={
            <CloseReview
              review={daily.closeReview.data}
              loading={loading}
              error={daily.closeReview.error}
            />
          }
        />
        <Route
          path="/review"
          element={
            <CloseReview
              review={daily.closeReview.data}
              loading={loading}
              error={daily.closeReview.error}
            />
          }
        />
        <Route
          path="/weekly"
          element={
            <WeeklyReview
              latest={latest.data}
              healthMap={healthMap}
            />
          }
        />
        <Route
          path="/performance"
          element={
            <SystemStats
              data={performance.data}
              loading={performance.loading}
              error={performance.error}
              healthMap={healthMap}
            />
          }
        />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
  const useHashRouter = import.meta.env.VITE_USE_HASH_ROUTER === '1'
  const RouterComponent = useHashRouter ? HashRouter : BrowserRouter
  const routerProps = useHashRouter
    ? { future: { v7_startTransition: true, v7_relativeSplatPath: true } }
    : { basename: basename === '/' ? undefined : basename, future: { v7_startTransition: true, v7_relativeSplatPath: true } }

  return (
    <RouterComponent {...routerProps}>
      <AppRoutes />
    </RouterComponent>
  )
}
