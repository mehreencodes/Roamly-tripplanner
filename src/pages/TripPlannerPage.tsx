import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, CheckCircle2, MapPin, Minus, Plus } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { useAuth } from '@/features/auth/authContext'
import { destinations } from '@/data/destinations'
import { tripActions } from '@/features/trips/tripStore'
import { addDays, fmtShort, seasonCheck, todayISO } from '@/features/trips/tripUtils'

const MAX_DAYS = 30

function Step({ n, label }: { n: number; label: string }) {
  return (
    <p className="flex items-center gap-3 text-sm font-medium text-forest">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs text-white">
        {n}
      </span>
      {label}
    </p>
  )
}

export default function TripPlannerPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [slug, setSlug] = useState(
    destinations.find((d) => d.slug === params.get('destination'))?.slug ?? destinations[0].slug,
  )
  const [startDate, setStartDate] = useState(todayISO())
  const [dayCount, setDayCount] = useState(3)
  const [title, setTitle] = useState('')

  const dest = destinations.find((d) => d.slug === slug) ?? destinations[0]
  const endLabel = fmtShort(addDays(startDate || todayISO(), dayCount - 1))
const season = seasonCheck(startDate || todayISO(), dayCount, dest.bestMonths)

   const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      navigate('/auth')
      return
    }
    const safeStart = startDate && startDate >= todayISO() ? startDate : todayISO()
    // const id = tripActions.create({
    //   destinationSlug: dest.slug,
    //   title: title.trim() || `Trip to ${dest.name}`,
    //   startDate: safeStart,
    //   dayCount,
    // })
    const id = tripActions.create({
  uid: user.uid,
  destinationSlug: dest.slug,
  title: title.trim() || `Trip to ${dest.name}`,
  startDate: safeStart,
  dayCount,
})
    navigate(`/trips/${id}`)
  }


  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 sm:pt-8">
      <header>
        <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
          <span className="h-px w-8 bg-terracotta" />
          New trip
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-forest sm:text-5xl">
          Plan a <em className="italic text-terracotta">trip</em>
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14"
      >
        <div className="space-y-10">
          {/* 1. Destination */}
          <div>
            <Step n={1} label="Where to?" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {destinations.map((d) => {
                const on = d.slug === slug
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSlug(d.slug)}
                    aria-pressed={on}
                    className={`group relative aspect-[4/3] overflow-hidden rounded-2xl bg-forest-dark text-left text-white transition active:scale-[0.98] ${
                      on ? 'ring-2 ring-terracotta ring-offset-2 ring-offset-cream' : 'ring-1 ring-black/5'
                    }`}
                  >
                    <SmartImage
                      src={d.image}
                      alt=""
                      className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="font-display text-lg leading-tight">{d.name}</p>
                      <p className="text-[11px] text-white/70">{d.country}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Dates */}
          <div>
            <Step n={2} label="When and how long?" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted">Start date</span>
                <input
  type="date"
  value={startDate}
  min={todayISO()}
  onChange={(e) => setStartDate(e.target.value)}
  onBlur={() => {
    if (!startDate || startDate < todayISO()) setStartDate(todayISO())
  }}
  required
  className="mt-2 h-12 w-full rounded-xl border border-sand bg-white px-4 text-sm text-ink outline-none transition focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
/>
              </label>

              <div>
                <span className="text-xs uppercase tracking-widest text-muted">Days</span>
                <div className="mt-2 flex h-12 items-center justify-between rounded-xl border border-sand bg-white px-2">
                  <button
                    type="button"
                    onClick={() => setDayCount((n) => Math.max(1, n - 1))}
                    disabled={dayCount <= 1}
                    aria-label="Fewer days"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-forest transition hover:bg-sand disabled:opacity-30"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-sm font-medium tabular-nums text-forest">{dayCount}</span>
                  <button
                    type="button"
                    onClick={() => setDayCount((n) => Math.min(MAX_DAYS, n + 1))}
                    disabled={dayCount >= MAX_DAYS}
                    aria-label="More days"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-forest transition hover:bg-sand disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>


{season.outside > 0 ? (
  <p className="mt-4 flex items-start gap-2 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
    {season.all
      ? `These dates are outside the best season for ${dest.name} (${dest.bestSeason}).`
      : `${season.outside} of your ${dayCount} days fall outside the best season (${dest.bestSeason}).`}
  </p>
) : (
  <p className="mt-4 flex items-start gap-2 rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest">
    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
    Good timing! These dates fall in the best season for {dest.name} ({dest.bestSeason}).
  </p>
)}
          {/* 3. Name */}
          <div>
            <Step n={3} label="Name it (optional)" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder={`Trip to ${dest.name}`}
              className="mt-4 h-12 w-full rounded-xl border border-sand bg-white px-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
            />
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-sand bg-white">
            <div className="relative aspect-[16/10] bg-forest-dark">
              <SmartImage src={dest.image} alt={dest.name} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-white/75">
                  <MapPin size={12} /> {dest.country}
                </p>
                <h2 className="font-display text-3xl leading-tight">{dest.name}</h2>
              </div>
            </div>

            <dl className="divide-y divide-sand px-5 text-sm">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-muted">Dates</dt>
                <dd className="flex items-center gap-1.5 font-medium text-forest">
                  <CalendarDays size={14} />
                  {fmtShort(addDays(startDate || todayISO(), 0))}
                  {dayCount > 1 && ` – ${endLabel}`}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-muted">Length</dt>
                <dd className="font-medium text-forest">
                  {dayCount} {dayCount === 1 ? 'day' : 'days'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="shrink-0 text-muted">Best season</dt>
                <dd className="text-right font-medium text-forest">{dest.bestSeason}</dd>
              </div>
            </dl>

            <div className="p-5 pt-2">
              <button
                type="submit"
                className="w-full rounded-full bg-terracotta py-3.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-[0.98]"
              >
                Create trip
              </button>
            </div>
          </div>
        </aside>
      </form>
    </section>
  )
}