import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search, TriangleAlert } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { heroGallery } from '@/data/images'

const popular = ['Hunza', 'Swat', 'Skardu', 'Kyoto']

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

// Har arch ki height aur upar se offset alag, chhoti aur badi screen dono ke liye
const arches = [
  { h: 'h-[150px] sm:h-[200px] lg:h-[240px]', offset: 'mt-8 sm:mt-10 lg:mt-12' },
  { h: 'h-[200px] sm:h-[270px] lg:h-[320px]', offset: 'mt-0' },
  { h: 'h-[140px] sm:h-[190px] lg:h-[220px]', offset: 'mt-12 sm:mt-14 lg:mt-16' },
]

export default function Hero() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const goSearch = (q: string) => {
    const value = q.trim()
    navigate(value ? `/explore?q=${encodeURIComponent(value)}` : '/explore')
  }

  return (
    <section className="relative overflow-hidden rounded-b-[2.5rem] bg-forest-dark text-white">
      {/* Background glows */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-terracotta/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-forest/60 blur-3xl" />

      {/* Route line jo khud draw hoti hai (sirf badi screen par) */}
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 1440 800"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M-20 700 C 280 560, 420 780, 700 600 S 1100 260, 1460 360"
          stroke="#d9693f"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: reduceMotion ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.4 }}
        />
      </svg>

      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: text + search */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={item}
            className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/70"
          >
            <span className="h-px w-8 bg-terracotta" />
            Discover · Plan · Split
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl"
          >
            Plan the trip,
            <br />
            skip the <em className="italic text-terracotta">chaos.</em>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
            Find where to go, build a day-by-day itinerary that checks itself, and split
            costs with your companions. One calm place for the whole trip.
          </motion.p>

          <motion.form
            variants={item}
            onSubmit={(e) => {
              e.preventDefault()
              goSearch(query)
            }}
            className="mt-9 flex max-w-xl items-center gap-2 rounded-full bg-cream p-2 shadow-2xl shadow-black/30"
          >
            <Search className="ml-3 shrink-0 text-muted" size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try Hunza, Kyoto, Santorini..."
              aria-label="Search destinations"
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-full bg-forest px-6 py-3 font-medium text-white transition hover:bg-forest-dark active:scale-95"
            >
              Explore
            </button>
          </motion.form>

          <motion.div variants={item} className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/50">Popular:</span>
            {popular.map((p) => (
              <button
                key={p}
                onClick={() => goSearch(p)}
                className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-white/80 transition hover:border-terracotta hover:text-white"
              >
                {p}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT: collage + itinerary card (ab har screen par) */}
        <div>
          <div className="flex items-start justify-center gap-3 sm:gap-4">
            {heroGallery.map((g, i) => (
              <motion.figure
                key={g.alt}
                initial={{ opacity: 0, y: 40 }}
                animate={
                  reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -8, 0] }
                }
                transition={{
                  opacity: { duration: 0.8, delay: 0.3 + i * 0.15 },
                  y: reduceMotion
                    ? { duration: 0.8 }
                    : { duration: 6 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
                }}
                className={`w-[30%] sm:w-32 lg:w-36 xl:w-40 ${arches[i].offset}`}
              >
                <SmartImage
                  src={g.src}
                  alt={g.alt}
                  className={`${arches[i].h} w-full rounded-t-full rounded-b-3xl shadow-2xl shadow-black/40`}
                />
                <figcaption className="mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-white/80 sm:text-xs sm:tracking-widest">
                  {g.label}
                </figcaption>
              </motion.figure>
            ))}
          </div>

          {/* Mini itinerary card: asli feature ka preview */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mx-auto mt-8 w-full max-w-[18rem] rounded-2xl bg-cream p-4 text-ink shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg text-forest">Day 2 · Hunza</p>
              <span className="text-xs text-muted">2 stops</span>
            </div>

            <ol className="mt-3 space-y-2.5 border-l border-sand pl-4 text-sm">
              <li className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-forest" />
                <span className="text-muted">09:00</span> Baltit Fort
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-forest" />
                <span className="text-muted">10:15</span> Attabad Lake
              </li>
            </ol>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-terracotta/10 p-2.5 text-xs text-terracotta">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" />
              <span>Travel gap looks too short. Want a better order?</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}