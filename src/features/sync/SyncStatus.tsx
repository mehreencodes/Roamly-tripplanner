import { CloudOff, RotateCw } from 'lucide-react'
import { retrySync, useSyncStatus } from './syncEngine'

export default function SyncStatus() {
  const s = useSyncStatus()
  const waking = s.slow && (s.phase === 'syncing' || s.phase === 'saving')
  if (!waking && s.phase !== 'error') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit max-w-md items-center gap-3 rounded-full border border-sand bg-white px-4 py-2.5 text-sm text-forest shadow-xl"
    >
      {waking ? (
        <>
          <RotateCw size={15} className="shrink-0 animate-spin text-terracotta" />
          <span>Waking up the server. This can take up to a minute.</span>
        </>
      ) : (
        <>
          <CloudOff size={15} className="shrink-0 text-terracotta" />
          <span>{s.message}</span>
          <button
            type="button"
            onClick={retrySync}
            className="shrink-0 font-medium text-terracotta underline-offset-4 hover:underline"
          >
            Retry
          </button>
        </>
      )}
    </div>
  )
}