import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { ApiError, apiEnabled, createShare, getShare, removeShare } from '@/lib/api'

export default function ShareButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null | undefined>(undefined) // undefined = load ho raha hai
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Panel khulne par maujooda halat load karo
  useEffect(() => {
    if (!open || token !== undefined) return
    let live = true
    getShare(tripId)
      .then((r) => {
        if (live) setToken(r.token)
      })
      .catch(() => {
        if (!live) return
        setToken(null)
        setError('Could not load sharing. Make sure the trip has finished syncing.')
      })
    return () => {
      live = false
    }
  }, [open, token, tripId])

  // Server ke baghair sharing mumkin nahi
  if (!apiEnabled) return null

  const url = token ? `${window.location.origin}/share/${token}` : ''

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 404
          ? 'This trip has not reached the server yet. Wait a moment and try again.'
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: user input se haath se copy kar sakta hai */
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-sand bg-white px-5 py-2.5 text-sm font-medium text-forest transition hover:border-forest/40 active:scale-95"
      >
        <Link2 size={15} /> Share
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-2xl border border-sand bg-white p-4 shadow-xl">
          <p className="font-display text-lg text-forest">Share this trip</p>
          <p className="mt-1 text-sm text-muted">
            Anyone with the link can view the itinerary. They cannot edit it, and your budget is
            not shared.
          </p>

          {token === undefined ? (
            <div className="mt-4 h-10 animate-pulse rounded-xl bg-sand" />
          ) : token ? (
            <>
              <div className="mt-4 flex items-center gap-2">
                <input
                  readOnly
                  value={url}
                  aria-label="Share link"
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-sand bg-cream px-3 text-xs text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={copy}
                  aria-label="Copy link"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-white transition hover:bg-forest-dark active:scale-95"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await removeShare(tripId)
                    setToken(null)
                  })
                }
                className="mt-3 text-sm font-medium text-terracotta underline-offset-4 hover:underline disabled:opacity-50"
              >
                Stop sharing
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const r = await createShare(tripId)
                  setToken(r.token)
                })
              }
              className="mt-4 w-full rounded-full bg-forest py-2.5 text-sm font-medium text-white transition hover:bg-forest-dark active:scale-95 disabled:opacity-50"
            >
              {busy ? 'Creating...' : 'Create link'}
            </button>
          )}

          {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}
        </div>
      )}
    </div>
  )
}