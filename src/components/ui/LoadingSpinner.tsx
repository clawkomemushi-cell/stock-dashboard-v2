export function LoadingSpinner({ message = '載入中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  )
}

export function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
        <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="text-danger text-sm">{message}</p>
    </div>
  )
}

export function EmptyState({ message = '暫無資料' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  )
}
