import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Clock,
  Compass,
  Landmark,
  MapPin,
  Sparkles,
} from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import Gallery from '@/features/discover/Gallery'
import DestinationMap from '@/features/discover/DestinationMap'
import { useAuth } from '@/features/auth/authContext'
import { useSaved } from '@/features/saved/useSaved'
import { destinations } from '@/data/destinations'
import { formatDuration } from '@/lib/format'

export default function DestinationDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isSaved, toggle } = useSaved()
  const d = destinations.find((x) => x.slug === slug)

  useEffect(() => {
    if (!d) return
    document.title = `${d.name} | Roamly`
    return () => {
      document.title = 'Roamly | Plan together. Travel better.'
    }
  }, [d])

  if (!d) {
    return (
      <section className="mx-auto max-w-xl px-6 pb-24 pt-40 text-center">
        <h1 className="font-display text-4xl text-forest">Destination not found</h1>
        <p className="mt-3 text-muted">We couldn't find that place. Try exploring instead.</p>
        <Link
          to="/explore"
          className="mt-8 inline-block rounded-full bg-terracotta px-7 py-3 font-medium text-white"
        >
          Back to Explore
        </Link>
      </section>
    )
  }

  const saved = isSaved(d.slug)

  const handleSave = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    toggle(d.slug)
  }

  const facts = [
    { icon: MapPin, label: 'Country', value: d.country },
    { icon: CalendarDays, label: 'Best time', value: d.bestSeason },
    { icon: Compass, label: 'Style', value: d.category },
    { icon: Landmark, label: 'Top spots', value: `${d.attractions.length} places` },
  ]

  return (
    <>
      {/* HERO */}
      <section className="relative h-[72svh] min-h-[500px] overflow-hidden rounded-b-[2.5rem] bg-forest-dark text-white">
        <SmartImage src={d.image} alt={d.name} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/45" />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col px-6 pb-12 pt-28">
          <Link
            to="/explore"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md transition hover:bg-white/20"
          >
            <ArrowLeft size={16} /> All destinations
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-auto"
          >
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium capitalize backdrop-blur-md">
              {d.category}
            </span>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              {d.name}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-lg text-white/80">
              <MapPin size={18} /> {d.country} · {d.tagline}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={`/trips/new?destination=${d.slug}`}
                className="group flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
              >
                Plan a trip here
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <button
                onClick={handleSave}
                aria-pressed={saved}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 font-medium backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <Bookmark size={18} className={saved ? 'fill-current' : ''} />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK FACTS */}
      <div className="relative mx-auto -mt-8 max-w-7xl px-6">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-sand bg-sand shadow-xl shadow-forest/5 md:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-cream p-5">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
                <Icon size={14} className="text-terracotta" /> {label}
              </dt>
              <dd className="mt-2 font-medium capitalize text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ABOUT + HIGHLIGHTS */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-3xl text-forest sm:text-4xl">About {d.name}</h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/80">{d.description}</p>
        </div>
        <div className="rounded-3xl bg-sand/60 p-6">
          <h3 className="font-display text-xl text-forest">Highlights</h3>
          <ul className="mt-4 space-y-3">
            {d.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-ink/80">
                <Sparkles size={18} className="mt-0.5 shrink-0 text-terracotta" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GALLERY */}
      {d.gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="mb-6 font-display text-3xl text-forest sm:text-4xl">Gallery</h2>
          <Gallery images={d.gallery} name={d.name} />
        </section>
      )}

      {/* PLACES + MAP */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="font-display text-3xl text-forest sm:text-4xl">Places to visit</h2>
        <p className="mt-2 text-muted">Numbers match the markers on the map.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <ol className="space-y-4">
            {d.attractions.map((a, i) => (
              <li key={a.id} className="flex gap-4 rounded-2xl border border-sand bg-white p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-display text-xl text-forest">{a.name}</h3>
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs capitalize text-forest">
                      {a.kind}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/75">{a.description}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Clock size={13} /> About {formatDuration(a.durationMin)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <DestinationMap attractions={d.attractions} name={d.name} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-forest-dark px-8 py-14 text-center text-white sm:py-16">
          <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-terracotta/20 blur-3xl" />
          <h2 className="relative font-display text-3xl sm:text-5xl">
            Ready to plan {d.name}?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/75">
            Build a day-by-day itinerary and invite friends along.
          </p>
          <Link
            to={`/trips/new?destination=${d.slug}`}
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-terracotta px-8 py-3.5 font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
          >
            Plan a trip <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}