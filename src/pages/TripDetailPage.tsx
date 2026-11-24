import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Wallet
} from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import ActivityCard from '@/features/trips/ActivityCard'
import { useAuth } from '@/features/auth/authContext'
import { tripActions, useTrips } from '@/features/trips/tripStore'
import {
  addDays,
  dateRange,
  dayStats,
  endMin,
  findDestination,
  fmtDay,
  formatTime,
  seasonCheck,
  nextStartMin,
} from '@/features/trips/tripUtils'
import { formatDuration } from '@/lib/format'
import type { Activity } from '@/types/trip'
import SchedulePanel from '@/features/trips/SchedulePanel'
import { analyzeTrip, type Issue } from '@/features/trips/scheduleEngine'
import TripReadiness from '@/features/trips/TripReadiness'
import { tripReadiness } from '@/features/trips/readiness'
import { useBudget } from '@/features/budget/budgetStore'
import CustomActivityForm from '@/features/trips/CustomActivityForm'    
      import TripMap from '@/features/trips/TripMap' 

/* "Day at a glance": 06:00 se 22:00 tak ki patti, overlap saaf nazar aata hai */
const VIEW_START = 6 * 60
const VIEW_END = 22 * 60
const VIEW_SPAN = VIEW_END - VIEW_START
const pct = (min: number) =>
  ((Math.min(Math.max(min, VIEW_START), VIEW_END) - VIEW_START) / VIEW_SPAN) * 100

function DayBar({ items }: { items: Activity[] }) {
  return (
    <div className="mt-5">
      <div
        role="img"
        aria-label="Day schedule overview"
        className="relative h-11 overflow-hidden rounded-xl bg-sand/70"
      >
        {items.map((a, i) => {
          const end = endMin(a)
          if (a.startMin === null || end === null) return null
          const left = pct(a.startMin)
          const width = Math.max(pct(end) - left, 2)
          return (
            <div
              key={a.id}
              title={`${a.title}, ${formatTime(a.startMin)} to ${formatTime(end)}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              className="absolute inset-y-1.5 flex items-center justify-center overflow-hidden rounded-lg bg-forest/75 text-[11px] font-medium text-white ring-1 ring-cream/60"
            >
              {i + 1}
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between px-0.5 text-[10px] tabular-nums text-muted">
        {[6, 10, 14, 18, 22].map((hour) => (
          <span key={hour}>{formatTime(hour * 60)}</span>
        ))}
      </div>
    </div>
  )
}

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const trips = useTrips()
    const budget = useBudget(id)
  const [activeDay, setActiveDay] = useState(0)
  const [activeView, setActiveView] = useState<'itinerary' | 'map'>('itinerary')
const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <div className="h-52 animate-pulse rounded-3xl bg-sand sm:h-60" />
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />

  const trip = trips.find((t) => t.id === id)
  const dest = trip ? findDestination(trip.destinationSlug) : undefined

  if (!trip || !dest) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
        <h1 className="font-display text-4xl text-forest">Trip not found</h1>
        <p className="mt-3 text-muted">It may have been deleted, or the link is wrong.</p>
        <Link
          to="/trips"
          className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest-dark"
        >
          Back to my trips
        </Link>
      </section>
    )
  }

  const day = Math.min(activeDay, trip.days.length - 1)
  const items = trip.days[day]
  const stats = dayStats(items)
  const totalPlaces = trip.days.reduce((n, d) => n + d.length, 0)
  const season = seasonCheck(trip.startDate, trip.days.length, dest.bestMonths)

    const allIssues = analyzeTrip(trip, dest.attractions)
  const dismissed = trip.dismissedIssues ?? []
  const issues = allIssues.filter((i) => !dismissed.includes(i.key))
  const dismissedCount = allIssues.length - issues.length
    const readiness = tripReadiness(trip, dest, issues, budget)

  const applyFix = (issue: Issue) => {
    const fix = issue.fix
    if (!fix) return
    if (fix.kind === 'shift') {
      tripActions.updateActivity(trip.id, issue.day, fix.activityId, { startMin: fix.startMin })
    } else {
      tripActions.moveToDay(trip.id, issue.day, fix.activityId, fix.toDay)
    }
  }
  const handleDelete = () => {
    if (window.confirm(`Delete "${trip.title}"? This can't be undone.`)) {
      tripActions.remove(trip.id)
      navigate('/trips')
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 sm:pt-8">
      <Link
        to="/trips"
        className="inline-flex items-center gap-2 text-sm font-medium text-forest transition hover:text-terracotta"
      >
        <ArrowLeft size={16} /> My trips
      </Link>

    
      {/* Banner */}
      <div className="relative mt-4 flex min-h-36 flex-col justify-end overflow-hidden rounded-3xl bg-forest-dark text-white sm:mt-5 sm:min-h-60">
        <div className="absolute inset-0">
  <SmartImage src={dest.image} alt={dest.name} className="h-full w-full" />
</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        <Link
          to={`/trips/${trip.id}/budget`}
          className="absolute right-16 top-4 z-10 flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-medium backdrop-blur-md transition hover:bg-white/25 active:scale-95"
        >
          <Wallet size={16} /> Budget
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete trip"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition hover:bg-red-500/80 active:scale-90"
        >
          <Trash2 size={17} />
        </button>

        <div className="relative px-5 pb-4 pt-14 sm:p-8">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/80">
            <MapPin size={13} className="shrink-0" />
            <span className="min-w-0">
              {dest.name}, {dest.country}
            </span>
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight sm:mt-1.5 sm:text-5xl">{trip.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} /> {dateRange(trip)}
            </span>
            <span>
              {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'} · {totalPlaces}{' '}
              {totalPlaces === 1 ? 'place' : 'places'}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md ${
                season.outside > 0 ? 'bg-terracotta text-white' : 'bg-white/15 text-white'
              }`}
            >
              {season.outside > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
              {season.outside === 0
                ? 'Best season'
                : season.all
                  ? 'Off-season'
                  : `${season.outside} ${season.outside === 1 ? 'day' : 'days'} off-season`}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        {/* Itinerary */}
        <div className="min-w-0">

{/* Itinerary / Map tabs */}
<div role="tablist" aria-label="Trip view" className="mb-5 flex gap-2">
  <button
    type="button"
    role="tab"
    aria-selected={activeView === 'itinerary'}
    onClick={() => setActiveView('itinerary')}
    className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
      activeView === 'itinerary'
        ? 'bg-forest text-white'
        : 'border border-sand bg-white text-forest hover:border-forest/40'
    }`}
  >
    Itinerary
  </button>

  <button
    type="button"
    role="tab"
    aria-selected={activeView === 'map'}
    onClick={() => setActiveView('map')}
    className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
      activeView === 'map'
        ? 'bg-forest text-white'
        : 'border border-sand bg-white text-forest hover:border-forest/40'
    }`}
  >
    <span className="inline-flex items-center gap-1.5">
      <MapPin size={15} /> Map
    </span>
  </button>
</div>

          {/* Day tabs */}
          <div
            role="tablist"
            className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

{activeView === 'itinerary' ? (
  <>
    {items.length > 0 && <DayBar items={items} />}

    {items.length === 0 ? (
      <div className="mt-6 rounded-3xl border border-dashed border-sand bg-white/60 px-6 py-14 text-center">
        <p className="font-display text-xl text-forest">
          Day {day + 1} is empty
        </p>
        <p className="mt-1 text-sm text-muted">
          Add places from the list, or add your own activity below.
        </p>
      </div>
    ) : (
      // <div role="list" className="mt-6 space-y-3">
      //   {items.map((a, i) => (
      //     <div
      //       key={a.id}
      //       role="listitem"
      //       onClick={() => setSelectedActivityId(a.id)}
      //       className={`rounded-3xl transition ${
      //         selectedActivityId === a.id
      //           ? 'ring-2 ring-terracotta ring-offset-2'
      //           : ''
      //       }`}
      //     >
      //       <ActivityCard
      //         activity={a}
      //         place={dest.attractions.find((p) => p.id === a.placeId)}
      //         index={i}
      //         isFirst={i === 0}
      //         isLast={i === items.length - 1}
      //         onTimeChange={(startMin) =>
      //           tripActions.updateActivity(trip.id, day, a.id, { startMin })
      //         }
      //         onDurationChange={(durationMin) =>
      //           tripActions.updateActivity(trip.id, day, a.id, { durationMin })
      //         }
      //         onMove={(dir) => tripActions.moveActivity(trip.id, day, i, dir)}
      //         onRemove={() => tripActions.removeActivity(trip.id, day, a.id)}
      //         onRename={(title) =>
      //           tripActions.renameActivity(trip.id, day, a.id, title)
      //         }
      //       />
      //     </div>
      //   ))}
      // </div>
      <ol className="mt-6 space-y-3">
  {items.map((a, i) => (
    <ActivityCard
      key={a.id}
      activity={a}
      place={dest.attractions.find((p) => p.id === a.placeId)}
      index={i}
      isFirst={i === 0}
      isLast={i === items.length - 1}
      selected={selectedActivityId === a.id}
      onSelect={() => setSelectedActivityId(a.id)}
      onTimeChange={(startMin) =>
        tripActions.updateActivity(trip.id, day, a.id, { startMin })
      }
      onDurationChange={(durationMin) =>
        tripActions.updateActivity(trip.id, day, a.id, { durationMin })
      }
      onMove={(dir) => tripActions.moveActivity(trip.id, day, i, dir)}
      onRemove={() => tripActions.removeActivity(trip.id, day, a.id)}
      onRename={(title) => tripActions.renameActivity(trip.id, day, a.id, title)}
    />
  ))}
</ol>
    )}

    <CustomActivityForm
      key={day}
      suggestedStart={nextStartMin(items, 60)}
      onAdd={(input) => tripActions.addCustom(trip.id, day, input)}
    />
  </>
) : (
  <div className="mt-6">
    <TripMap
      activities={items}
      attractions={dest.attractions}
      selectedActivityId={selectedActivityId}
      onSelectActivity={setSelectedActivityId}
    />
  </div>
)}

        </div>

        {/* Add places */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <TripReadiness readiness={readiness} onGoToDay={setActiveDay} />
          <SchedulePanel
            issues={issues}
            dayIndex={day}
            activityCount={items.length}
            dismissedCount={dismissedCount}
            onSelectDay={setActiveDay}
            onApply={applyFix}
            onDismiss={(issue) => tripActions.dismissIssue(trip.id, issue.key)}
            onRestore={() => tripActions.restoreIssues(trip.id)}
          />
          <div className="rounded-3xl border border-sand bg-white p-5">
            <h2 className="font-display text-xl text-forest">Places in {dest.name}</h2>
            <p className="mt-1 text-sm text-muted">Adding to Day {day + 1}</p>

            <ul className="mt-4 divide-y divide-sand">
              {dest.attractions.map((a) => {
                const placedIn = trip.days.findIndex((list) => list.some((x) => x.placeId === a.id))
                const here = placedIn === day
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-forest">{a.name}</p>
                      <p className="text-xs text-muted">
                        <span className="capitalize">{a.kind}</span> ·{' '}
                        {formatDuration(a.durationMin)}
                        {placedIn >= 0 && !here && ` · Day ${placedIn + 1}`}
                      </p>
                    </div>
                    {here ? (
                      <span className="flex items-center gap-1 rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-forest">
                        <Check size={13} /> Added
                      </span>
                    ) : (
         <button
  type="button"
  onClick={() => tripActions.addPlace(trip.id, day, a.id)}
  className="flex items-center gap-1 rounded-full border border-forest/20 px-3 py-1.5 text-xs font-medium text-forest transition hover:bg-forest hover:text-white active:scale-95"
>
  <Plus size={13} /> {placedIn >= 0 ? 'Move here' : 'Add'}
</button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}