import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search } from 'lucide-react'
import HeroDemo from '@/features/home/HeroDemo'

const popular = ['Kyoto', 'Santorini', 'Dubai', 'Bali']

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

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

<div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-20 pt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        {/* LEFT: text + search */}
        <motion.div variants={container} initial="hidden" animate="show" className="min-w-0">
          <motion.p
            variants={item}
            className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/70"
          >
            <span className="h-px w-8 bg-terracotta" />
            Discover · Plan · Budget
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl"
          >
            Plan the trip,
            <br />
            skip the <em className="italic text-terracotta">chaos.</em>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
            From Kyoto to Santorini, find where to go, build a day-by-day itinerary that
            checks itself, and keep the budget in one calm place.
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
              placeholder="Try Kyoto, Dubai, Santorini..."
              aria-label="Search destinations"
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-full bg-forest px-5 py-3 font-medium text-white transition hover:bg-forest-dark active:scale-95 sm:px-6"
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

        {/* RIGHT: live product demo */}
        <div className="mx-auto w-full max-w-[26rem] lg:mx-0 lg:justify-self-end">
          <HeroDemo />
        </div>
      </div>
    </section>
  )
}