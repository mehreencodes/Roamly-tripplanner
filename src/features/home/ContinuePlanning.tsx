import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, MapPin } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { analyzeTrip } from '@/features/trips/scheduleEngine'
import { useTrips } from '@/features/trips/tripStore'
import { addDays, dateRange, findDestination, isPast } from '@/features/trips/tripUtils'
import type { Trip } from '@/types/trip'

const DAY_MS = 86_400_000

function startLabel(trip: Trip) {
  const today = new Date().setHours(0, 0, 0, 0)
  const diff = Math.round((addDays(trip.startDate, 0).getTime() - today) / DAY_MS)

  if (diff > 1) return `Starts in ${diff} days`
  if (diff === 1) return 'Starts tomorrow'
  if (diff === 0) return 'Starts today'
  return `Day ${1 - diff} of ${trip.days.length}`
}

export default function ContinuePlanning() {
  const trips = useTrips()

  const next = trips
    .filter((t) => !isPast(t))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  const dest = next ? findDestination(next.destinationSlug) : undefined

  if (!next || !dest) return null

  const places = next.days.reduce((n, d) => n + d.length, 0)
  const dismissed = next.dismissedIssues ?? []
  const openIssues = analyzeTrip(next, dest.attractions).filter(
    (i) => !dismissed.includes(i.key),
  ).length

  return (
    <section className="mx-auto max-w-7xl px-6 pt-12">
      <h2 className="text-xs uppercase tracking-[0.25em] text-muted">Continue planning</h2>

      <Link
        to={`/trips/${next.id}`}
        className="group mt-4 flex overflow-hidden rounded-3xl border border-sand bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="relative w-28 shrink-0 overflow-hidden bg-forest-dark sm:w-56">
          <SmartImage
            src={dest.image}
            alt={dest.name}
            className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">
                {dest.name}, {dest.country}
              </span>
            </p>
            <h3 className="mt-1.5 truncate font-display text-2xl text-forest sm:text-3xl">
              {next.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-terracotta">{startLabel(next)}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> {dateRange(next)}
              </span>
              <span>
                {places} {places === 1 ? 'place' : 'places'}
              </span>
              <span
                className={`flex items-center gap-1.5 ${
                  openIssues > 0 ? 'text-terracotta' : 'text-forest'
                }`}
              >
                {openIssues > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                {openIssues > 0
                  ? `${openIssues} ${openIssues === 1 ? 'issue' : 'issues'} to review`
                  : 'No schedule issues'}
              </span>
            </p>

            <span className="flex items-center gap-1.5 text-sm font-medium text-forest">
              Open trip
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}