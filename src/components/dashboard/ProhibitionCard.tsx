interface Props {
  prohibitions: string[]
  cautions?: string[]
}

export function ProhibitionCard({ prohibitions, cautions }: Props) {
  return (
    <div className="space-y-3">
      {/* Prohibitions */}
      <div className="card border-l-4 border-l-danger p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="section-title text-danger">今日禁止事項</span>
        </div>
        <ul className="space-y-2">
          {prohibitions.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
              <span className="shrink-0 w-5 h-5 rounded bg-danger/15 text-danger text-[10px] font-bold font-mono flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cautions */}
      {cautions && cautions.length > 0 && (
        <div className="card border-l-4 border-l-warning p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="section-title text-warning">注意事項</span>
          </div>
          <ul className="space-y-2">
            {cautions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <span className="shrink-0 text-warning mt-0.5">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
