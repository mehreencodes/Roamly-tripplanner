import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import SmartImage from '@/components/ui/SmartImage'
import TripMap from '@/features/trips/TripMap'
import {
  addDays,
  dateRange,
  dayStats,
  endMin,
  findDestination,
  fmtDay,
  formatTime,
} from '@/features/trips/tripUtils'
import { ApiError, fetchSharedTrip, type SharedTrip } from '@/lib/api'
import { formatDuration } from '@/lib/format'
import usePageTitle from '@/lib/usePageTitle'
import type { Trip } from '@/types/trip'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" aria-label="Roamly home">
          <Logo />
        </Link>
        <Link
          to="/"
          className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
        >
          Plan your own trip
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-20">{children}</main>
    </div>
  )
}

function Message({ title, text, retry }: { title: string; text: string; retry?: boolean }) {
  return (
    <div className="mx-auto mt-20 flex max-w-sm flex-col items-center text-center">
      <h1 className="font-display text-3xl text-forest">{title}</h1>
      <p className="mt-3 text-sm text-muted">{text}</p>
      {retry && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest-dark active:scale-95"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export default function SharedTripPage() {
  const { token } = useParams()
  const [trip, setTrip] = useState<SharedTrip | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [slow, setSlow] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [view, setView] = useState<'itinerary' | 'map'>('itinerary')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  usePageTitle(trip ? `${trip.title} · Roamly` : 'Shared trip · Roamly')

  useEffect(() => {
    if (!token) {
      setPhase('missing')
      return
    }
    let live = true
    const timer = setTimeout(() => {
      if (live) setSlow(true)
    }, 4000)

    fetchSharedTrip(token)
      .then((t) => {
        if (!live) return
        setTrip(t)
        setPhase('ready')
      })
      .catch((e) => {
        if (live) setPhase(e instanceof ApiError && e.status === 404 ? 'missing' : 'error')
      })
      .finally(() => clearTimeout(timer))

    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [token])

  const dest = trip ? findDestination(trip.destinationSlug) : undefined

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="h-44 animate-pulse rounded-3xl bg-sand sm:h-56" />
        {slow && (
          <p className="mt-4 text-center text-sm text-muted">
            Waking up the server. This can take up to a minute.
          </p>
        )}
      </Shell>
    )
  }

  if (phase === 'error') {
    return (
      <Shell>
        <Message
          title="Could not load this trip"
          text="The server did not respond. Check your connection and try again."
          retry
        />
      </Shell>
    )
  }

  if (phase === 'missing' || !trip || !dest) {
    return (
      <Shell>
        <Message
          title="This link is not available"
          text="The owner may have stopped sharing this trip, or the link is wrong."
        />
      </Shell>
    )
  }

  const day = Math.min(activeDay, trip.days.length - 1)
  const items = trip.days[day]
  const stats = dayStats(items)
  const totalPlaces = trip.days.reduce((n, d) => n + d.length, 0)
  const asTrip: Trip = { ...trip, id: 'shared', uid: '' }

  return (
    <Shell>
      {/* Banner */}
      <div className="relative flex min-h-36 flex-col justify-end overflow-hidden rounded-3xl bg-forest-dark text-white sm:min-h-52">
        <div className="absolute inset-0">
          <SmartImage src={dest.image} alt={dest.name} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <div className="relative px-5 pb-5 pt-16 sm:p-8">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/80">
            <MapPin size={13} className="shrink-0" />
            {dest.name}, {dest.country}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight sm:mt-1.5 sm:text-5xl">
            {trip.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} /> {dateRange(asTrip)}
            </span>
            <span>
              {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'} · {totalPlaces}{' '}
              {totalPlaces === 1 ? 'place' : 'places'}
            </span>
          </p>
        </div>
      </div>

      {/* View tabs */}
      <div role="tablist" aria-label="Trip view" className="mt-6 flex gap-2">
        {(['itinerary', 'map'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              view === v
                ? 'bg-forest text-white'
                : 'border border-sand bg-white text-forest hover:border-forest/40'
            }`}
          >
            {v === 'itinerary' ? (
              'Itinerary'
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} /> Map
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Day tabs */}
      <div
        role="tablist"
        aria-label="Day"
        className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {trip.days.map((list, i) => {
          const on = i === day
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveDay(i)}
              className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition active:scale-95 ${
                on
                  ? 'border-forest bg-forest text-white'
                  : 'border-sand bg-white text-forest hover:border-forest/40'
              }`}
            >
              <span className="block text-sm font-medium">Day {i + 1}</span>
              <span className={`block text-xs ${on ? 'text-white/70' : 'text-muted'}`}>
                {fmtDay(addDays(trip.startDate, i))} · {list.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Day summary */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-sand pb-4">
        <h2 className="font-display text-2xl text-forest">
          {fmtDay(addDays(trip.startDate, day))}
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Clock size={14} />
          {items.length === 0
            ? 'Nothing planned'
            : stats.first !== null && stats.last !== null
              ? `${formatTime(stats.first)} – ${formatTime(stats.last)} · ${formatDuration(stats.plannedMin)} planned`
              : `${formatDuration(stats.plannedMin)} planned`}
        </p>
      </div>

      {view === 'itinerary' ? (
        items.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-sand bg-white/60 px-6 py-14 text-center">
            <p className="font-display text-xl text-forest">Nothing planned for this day</p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {items.map((a, i) => {
              const end = endMin(a)
              const place = dest.attractions.find((p) => p.id === a.placeId)
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-4 rounded-2xl border border-sand bg-white p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand font-display text-sm tabular-nums text-forest">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-forest">{a.title}</h3>
                    {place && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">{place.description}</p>
                    )}
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {a.startMin === null || end === null
                          ? 'No time set'
                          : `${formatTime(a.startMin)} to ${formatTime(end)}`}
                      </span>
                      <span>{formatDuration(a.durationMin)}</span>
                      <span className="rounded-full bg-sand px-2.5 py-0.5 capitalize text-forest">
                        {place ? place.kind : 'Custom'}
                      </span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )
      ) : (
        <div className="mt-6">
          <TripMap
            activities={items}
            attractions={dest.attractions}
            selectedActivityId={selectedId}
            onSelectActivity={setSelectedId}
          />
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        You are viewing a read-only copy of this trip. Budget details are not shared.
      </p>
    </Shell>
  )
}