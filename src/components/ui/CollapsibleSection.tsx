import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  badge?: ReactNode
}

export function CollapsibleSection({ title, defaultOpen = false, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="section-title">{title}</span>
          {badge}
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}
