import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Clock,
  MapPin,
} from 'lucide-react'

import { useAuth } from '@/features/auth/authContext'
import { useSaved } from '@/features/saved/useSaved'
import { destinations } from '@/data/destinations'
import { formatDuration } from '@/lib/format'

/* Yahan jo naam likhoge wohi section mein dikhengi. Naam destinations ke "name" se bilkul match hone chahiye. */
const FEATURED_NAMES = ['Kyoto', 'Santorini', 'Dubai', 'Bali', 'Hunza Valley']

const picked = FEATURED_NAMES.flatMap((name) => {
  const found = destinations.find((d) => d.name === name)
  return found ? [found] : []
})

// Agar koi naam match na ho to pehli 5 destinations dikha do, section khali na rahe
const featured = picked.length >= 3 ? picked : destinations.slice(0, 5)
const pad = (i: number) => String(i + 1).padStart(2, '0')

export default function FeaturedDestinations() {
  const [active, setActive] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isSaved, toggle } = useSaved()

  if (featured.length === 0) return null

  const current = featured[active]
  const totalMin = current.attractions.reduce((sum, a) => sum + a.durationMin, 0)
  const saved = isSaved(current.slug)

  const handleSave = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    toggle(current.slug)
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
            <span className="h-px w-8 bg-terracotta" />
            Featured destinations
          </p>
          <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-forest sm:text-5xl">
            Places worth the <em className="italic text-terracotta">journey.</em>
          </h2>
          <p className="mt-3 max-w-md text-muted">
            Pick a place to preview it, then open the full guide or start planning.
          </p>
        </div>

        <Link
          to="/explore"
          className="group hidden shrink-0 items-center gap-2 text-sm font-medium text-forest sm:flex"
        >
          Explore all
          <ArrowRight
            size={16}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
      >
        {/* LEFT: numbered list (sirf badi screen par) */}
        <ul className="hidden border-t border-sand lg:block">
          {featured.map((d, i) => {
            const on = i === active
            return (
              <li key={d.id} className="border-b border-sand">
                <Link
                  to={`/destinations/${d.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group relative flex items-center gap-5 py-6 pl-5 pr-2"
                >
                  {on && (
                    <motion.span
                      layoutId="featured-bar"
                      className="absolute inset-y-4 left-0 w-1 rounded-full bg-terracotta"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span
                    className={`font-display text-sm tabular-nums transition-colors ${
                      on ? 'text-terracotta' : 'text-muted'
                    }`}
                  >
                    {pad(i)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-display text-3xl leading-tight transition-colors duration-300 ${
                        on ? 'text-forest' : 'text-ink/35 group-hover:text-ink/60'
                      }`}
                    >
                      {d.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {d.country} · <span className="capitalize">{d.category}</span>
                    </span>
                  </span>
                  <ArrowUpRight
                    size={22}
                    className={`shrink-0 text-terracotta transition duration-300 ${
                      on ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                    }`}
                  />
                </Link>
              </li>
            )
          })}
        </ul>

       {/* RIGHT: chips (mobile) + preview card */}
<div className="min-w-0">
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
            {featured.map((d, i) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${
                  i === active
                    ? 'border-forest bg-forest text-white'
                    : 'border-sand bg-white text-ink'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          <div className="relative mt-4 h-[480px] overflow-hidden rounded-[2rem] bg-forest-dark text-white sm:h-[540px] lg:mt-0 lg:h-[600px]">
           
              {featured.map((d, i) => (
  <img
    key={d.id}
    src={d.image}
    alt={i === active ? d.name : ''}
    loading="eager"
    className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
      i === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
    }`}
  />
))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/40" />

            {/* Top row */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium capitalize backdrop-blur-md">
                  {current.category}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur-md">
                  <CalendarDays size={13} /> {current.bestSeason}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSave}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${current.name} from saved` : `Save ${current.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition hover:bg-white/25 active:scale-90"
              >
                <Bookmark size={19} className={saved ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/80">
                    <MapPin size={14} /> {current.country}
                  </p>
                  <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                    {current.name}
                  </h3>
                  <p className="mt-2 max-w-md text-white/80">{current.tagline}</p>

                  <p className="mt-4 flex items-center gap-1.5 text-sm text-white/70">
                    <Clock size={15} />
                    {current.attractions.length} places · about {formatDuration(totalMin)} of sights
                  </p>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {current.attractions.slice(0, 3).map((a) => (
                      <li
                        key={a.id}
                        className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md"
                      >
                        {a.name}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/destinations/${current.slug}`}
                      className="group flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-forest transition hover:bg-white active:scale-95"
                    >
                      View destination
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                    <Link
                      to={`/trips/new?destination=${current.slug}`}
                      className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                    >
                      Plan a trip
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <Link
        to="/explore"
        className="mt-8 block rounded-full border border-forest/20 py-3.5 text-center text-sm font-medium text-forest transition hover:bg-sand sm:hidden"
      >
        Explore all destinations
      </Link>
    </section>
  )
}