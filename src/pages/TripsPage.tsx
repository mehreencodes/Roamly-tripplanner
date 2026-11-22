import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Compass, MapPin, Plus, Wallet } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { summarizeBudget } from '@/features/budget/budgetMath'
import { useBudget } from '@/features/budget/budgetStore'
import { useTrips } from '@/features/trips/tripStore'
import { dateRange, findDestination, isPast } from '@/features/trips/tripUtils'
import { formatMoney } from '@/lib/money'
import type { TripBudget } from '@/types/budget'
import type { Trip } from '@/types/trip'

function BudgetChip({ budget }: { budget: TripBudget | null }) {
  if (!budget) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <Wallet size={13} className="shrink-0" /> No budget yet
      </span>
    )
  }

  const summary = summarizeBudget(budget)

  if (summary.totalMinor === null) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <Wallet size={13} className="shrink-0" />
        {formatMoney(summary.projectedMinor, budget.currency)} planned
      </span>
    )
  }

  const used = Math.round((summary.projectedMinor / summary.totalMinor) * 100)
  const tone =
    summary.status === 'over'
      ? 'text-red-700'
      : summary.status === 'tight'
        ? 'text-terracotta'
        : 'text-forest'

  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${tone}`}>
      <Wallet size={13} className="shrink-0" />
      {formatMoney(summary.totalMinor, budget.currency)} ·{' '}
      {summary.status === 'over' ? 'Over budget' : `${used}% planned`}
    </span>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const budget = useBudget(trip.id)
  const dest = findDestination(trip.destinationSlug)
  if (!dest) return null
  const places = trip.days.reduce((n, d) => n + d.length, 0)

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group flex h-44 min-w-0 overflow-hidden rounded-3xl border border-sand bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:h-48"
    >
      <div className="relative w-32 shrink-0 overflow-hidden bg-forest-dark sm:w-44">
        <SmartImage
          src={dest.image}
          alt={dest.name}
          className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {dest.name}, {dest.country}
            </span>
          </p>
          <h3 className="mt-1.5 truncate font-display text-2xl text-forest">{trip.title}</h3>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> {dateRange(trip)}
              </span>
              <span>
                {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'} · {places}{' '}
                {places === 1 ? 'place' : 'places'}
              </span>
            </p>
            <BudgetChip budget={budget} />
          </div>
          <ArrowUpRight
            size={20}
            className="shrink-0 text-terracotta transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  )
}

function Group({ label, trips }: { label: string; trips: Trip[] }) {
  if (trips.length === 0) return null
  return (
    <div className="mt-10">
      <h2 className="text-xs uppercase tracking-[0.25em] text-muted">{label}</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {trips.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </div>
  )
}

export default function TripsPage() {
  const trips = useTrips()
  const upcoming = trips.filter((t) => !isPast(t))
  const past = trips.filter(isPast)

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 sm:pt-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
            <span className="h-px w-8 bg-terracotta" />
            Your plans
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest sm:text-5xl">
            My <em className="italic text-terracotta">trips</em>
          </h1>
        </div>
        {trips.length > 0 && (
          <Link
            to="/trips/new"
            className="flex w-fit items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
          >
            <Plus size={16} /> New trip
          </Link>
        )}
      </header>

      {trips.length === 0 ? (
        <div className="mx-auto mt-20 flex max-w-sm flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-forest">
            <Compass size={26} />
          </span>
          <h2 className="mt-5 font-display text-2xl text-forest">No trips yet</h2>
          <p className="mt-2 text-sm text-muted">
            Pick a destination, choose your dates and build your day-by-day plan.
          </p>
          <Link
            to="/trips/new"
            className="mt-6 flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest-dark active:scale-95"
          >
            <Plus size={16} /> Plan your first trip
          </Link>
        </div>
      ) : (
        <>
          <Group label="Upcoming" trips={upcoming} />
          <Group label="Past" trips={past} />
        </>
      )}
    </section>
  )
}