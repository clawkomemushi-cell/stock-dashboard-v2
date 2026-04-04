import type { ReactNode } from 'react'
import { Sidebar, MobileTabBar } from './Sidebar'
import { TopBar } from './TopBar'
import type { LatestIndex, FileHealth } from '../../types'

interface Props {
  children: ReactNode
  latest: LatestIndex | null
  latestError: string | null
  healthMap: Record<string, FileHealth>
}

export function Layout({ children, latest, latestError, healthMap }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar latest={latest} healthMap={healthMap} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="px-4 md:px-6 py-4 md:py-6 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
