
import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, RotateCcw, TriangleAlert, Wallet } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { destinations } from '@/data/destinations'
import { summarizeBudget, type BudgetSummary } from '@/features/budget/budgetMath'
import { analyzeDays, type Issue } from '@/features/trips/scheduleEngine'
import { endMin, formatTime } from '@/features/trips/tripUtils'
import { formatDuration } from '@/lib/format'
import type { LatLng } from '@/lib/geo'
import { formatMoney, type CurrencyCode } from '@/lib/money'
import type { Expense, ExpenseCategory } from '@/types/budget'
import type { Activity } from '@/types/trip'

/* ------------------------------ Demo ka data ------------------------------ */
/* Yeh asli schedule engine aur budget math par chalta hai. Saari jagahon ke coordinates asli hain. */

const h = (hours: number, minutes = 0) => hours * 60 + minutes

const COORDS: Record<string, LatLng> = {
  fushimi: { lat: 34.9671, lng: 135.7727 },
  kinkaku: { lat: 35.0394, lng: 135.7292 },
  arashiyama: { lat: 35.017, lng: 135.6713 },
  fira: { lat: 36.4166, lng: 25.4326 },
  oia: { lat: 36.4618, lng: 25.3753 },
  redbeach: { lat: 36.348, lng: 25.3949 },
  fahidi: { lat: 25.2637, lng: 55.2972 },
  burj: { lat: 25.1972, lng: 55.2744 },
  marina: { lat: 25.0805, lng: 55.1403 },
  baltit: { lat: 36.316, lng: 74.6648 },
  attabad: { lat: 36.317, lng: 74.86 },
  passu: { lat: 36.47, lng: 74.89 },
}

const coordsOf = (placeId: string) => COORDS[placeId]

const act = (
  id: string,
  placeId: string,
  title: string,
  startMin: number,
  durationMin: number,
): Activity => ({ id, placeId, title, startMin, durationMin })

const expense = (
  id: string,
  title: string,
  category: ExpenseCategory,
  estimatedMinor: number,
  actualMinor: number | null = null,
): Expense => ({ id, title, category, estimatedMinor, actualMinor, dayIndex: null, createdAt: 0 })

type ScenarioId = 'kyoto' | 'santorini' | 'dubai' | 'hunza'

interface Scenario {
  id: ScenarioId
  label: string
  /** destinations mein naam is se dhoondh kar photo li jati hai */
  match: string
  title: string
  country: string
  day: number
  start: Activity[]
  currency: CurrencyCode
  /** Minor units (JPY mein yen, baaqi mein paisay/cents) */
  total: number
  expenses: Expense[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'kyoto',
    label: 'Kyoto',
    match: 'kyoto',
    title: 'Trip to Kyoto',
    country: 'Japan',
    day: 1,
    start: [
      act('b1', 'fushimi', 'Fushimi Inari', h(9), 120),
      act('b2', 'kinkaku', 'Kinkaku-ji', h(10, 30), 60),
      act('b3', 'arashiyama', 'Arashiyama Bamboo Grove', h(14), 75),
    ],
    currency: 'JPY',
    total: 300_000,
    expenses: [
      expense('y1', 'Hotel', 'accommodation', 120_000, 126_000),
      expense('y2', 'Rail pass', 'transport', 50_000),
      expense('y3', 'Meals', 'food', 40_000),
    ],
  },
  {
    id: 'santorini',
    label: 'Santorini',
    match: 'santorini',
    title: 'Trip to Santorini',
    country: 'Greece',
    day: 1,
    start: [
      act('c1', 'fira', 'Fira old town', h(9, 30), 120),
      act('c2', 'oia', 'Oia sunset walk', h(11), 120),
      act('c3', 'redbeach', 'Red Beach', h(15), 90),
    ],
    currency: 'EUR',
    total: 180_000,
    expenses: [
      expense('z1', 'Hotel', 'accommodation', 70_000, 74_000),
      expense('z2', 'Ferry and taxis', 'transport', 24_000),
      expense('z3', 'Meals', 'food', 18_000),
    ],
  },
  {
    id: 'dubai',
    label: 'Dubai',
    match: 'dubai',
    title: 'Trip to Dubai',
    country: 'UAE',
    day: 2,
    start: [
      act('d1', 'fahidi', 'Al Fahidi Historic District', h(9), 120),
      act('d2', 'burj', 'Burj Khalifa', h(10, 30), 90),
      act('d3', 'marina', 'Dubai Marina Walk', h(15), 90),
    ],
    currency: 'AED',
    total: 900_000,
    expenses: [
      expense('w1', 'Hotel', 'accommodation', 400_000, 420_000),
      expense('w2', 'Desert safari', 'activities', 120_000),
      expense('w3', 'Meals', 'food', 90_000),
    ],
  },
  {
    id: 'hunza',
    label: 'Hunza',
    match: 'hunza',
    title: 'Trip to Hunza',
    country: 'Pakistan',
    day: 2,
    start: [
      act('a1', 'baltit', 'Baltit Fort', h(9), 90),
      act('a2', 'attabad', 'Attabad Lake', h(10), 120),
      act('a3', 'passu', 'Passu Cones', h(14, 30), 75),
    ],
    currency: 'PKR',
    total: 15_000_000,
    expenses: [
      expense('x1', 'Hotel', 'accommodation', 6_000_000, 6_250_000),
      expense('x2', 'Jeep hire', 'transport', 3_000_000),
      expense('x3', 'Meals', 'food', 1_800_000),
    ],
  },
]

const BUDGETS = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, summarizeBudget({ totalMinor: s.total, expenses: s.expenses })]),
) as Record<ScenarioId, BudgetSummary>

const PENALTY = { error: 30, warning: 10, info: 5 } as const
const healthScore = (issues: Issue[]) =>
  Math.max(0, 100 - issues.reduce((sum, i) => sum + PENALTY[i.severity], 0))

/* "Day at a glance" patti: 08:00 se 17:00 */
const VIEW_START = h(8)
const VIEW_END = h(17)
const VIEW_SPAN = VIEW_END - VIEW_START
const pct = (min: number) =>
  ((Math.min(Math.max(min, VIEW_START), VIEW_END) - VIEW_START) / VIEW_SPAN) * 100

const statusLabel = {
  'on-track': 'On track',
  tight: 'Close to the limit',
  over: 'Over budget',
} as const

/* --------------------------------- Ring ---------------------------------- */

function HealthRing({ score }: { score: number }) {
  const reduce = useReducedMotion()
  const good = score >= 90
  return (
    <div
      role="img"
      aria-label={`Schedule health ${score} out of 100`}
      className="relative h-12 w-12 shrink-0"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" className="stroke-sand" />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={good ? 'stroke-forest' : 'stroke-terracotta'}
          initial={false}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm tabular-nums text-forest">
        {score}
      </span>
    </div>
  )
}

/* -------------------------------- Component ------------------------------- */

export default function HeroDemo() {
  const reduce = useReducedMotion()
  const [scenarioId, setScenarioId] = useState<ScenarioId>(SCENARIOS[0].id)
  const [activities, setActivities] = useState<Activity[]>(SCENARIOS[0].start)

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]
  const budget = BUDGETS[scenario.id]
  const photo =
    destinations.find((d) => d.name.toLowerCase().includes(scenario.match))?.image ?? ''

  const issues = useMemo(() => analyzeDays([activities], coordsOf), [activities])
  const issue = issues[0]
  const score = healthScore(issues)
  const plannedMin = activities.reduce((sum, a) => sum + a.durationMin, 0)

  const choose = (s: Scenario) => {
    setScenarioId(s.id)
    setActivities(s.start)
  }

  const applyFix = (found: Issue) => {
    const fix = found.fix
    if (!fix || fix.kind !== 'shift') return
    setActivities((list) =>
      list.map((a) => (a.id === fix.activityId ? { ...a, startMin: fix.startMin } : a)),
    )
  }

  const total = budget.totalMinor ?? 1
  const spentW = (budget.spentMinor / total) * 100
  const plannedW = (budget.plannedMinor / total) * 100

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-terracotta/10 blur-3xl" />

      {/* App window */}
      <motion.div
        role="group"
        aria-label="Interactive schedule checker demo"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl bg-cream p-3.5 text-ink shadow-2xl shadow-black/40 ring-1 ring-white/20"
      >
        <span className="absolute -top-3 left-5 rounded-full bg-terracotta px-3 py-1 text-[11px] font-medium text-white shadow-lg">
          Live demo
        </span>

        {/* Trip tabs */}
        <div
          role="group"
          aria-label="Choose a demo trip"
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === scenario.id}
              onClick={() => choose(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition active:scale-95 ${
                s.id === scenario.id
                  ? 'bg-forest text-white'
                  : 'bg-sand text-forest hover:bg-sand/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Header + health */}
        <div className="mt-3 flex items-center gap-3">
          <SmartImage src={photo} alt={scenario.label} className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight text-forest">
              {scenario.title}
            </p>
            <p className="truncate text-xs text-muted">
              {scenario.country} · Day {scenario.day} · {formatDuration(plannedMin)}
            </p>
          </div>
          <HealthRing score={score} />
        </div>

        {/* Day at a glance */}
        <div className="mt-3">
          <div className="relative h-7 overflow-hidden rounded-lg bg-sand/70" aria-hidden="true">
            {activities.map((a, i) => {
              const end = endMin(a)
              if (a.startMin === null || end === null) return null
              const left = pct(a.startMin)
              const width = Math.max(pct(end) - left, 3)
              const flagged = issues.some((x) => x.activityIds.includes(a.id))
              return (
                <motion.div
                  key={a.id}
                  initial={false}
                  animate={{ left: `${left}%`, width: `${width}%` }}
                  transition={
                    reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 26 }
                  }
                  className={`absolute inset-y-1 flex items-center justify-center rounded-md text-[11px] font-medium text-white ring-1 ring-cream/70 transition-colors duration-300 ${
                    flagged ? 'bg-terracotta' : 'bg-forest/80'
                  }`}
                >
                  {i + 1}
                </motion.div>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between px-0.5 text-[10px] tabular-nums text-muted">
            {[8, 11, 14, 17].map((hour) => (
              <span key={hour}>{formatTime(hour * 60)}</span>
            ))}
          </div>
        </div>

        {/* Activities */}
        <ol className="mt-2.5 space-y-1.5">
          {activities.map((a, i) => {
            const end = endMin(a)
            const flagged = issues.some((x) => x.activityIds.includes(a.id))
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors duration-300 ${
                  flagged ? 'border-red-300 bg-red-50' : 'border-sand bg-white'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand font-display text-xs tabular-nums text-forest">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight text-forest">
                    {a.title}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    {a.startMin === null || end === null
                      ? 'No time set'
                      : `${formatTime(a.startMin)} to ${formatTime(end)} · ${formatDuration(a.durationMin)}`}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        {/* Schedule check */}
        <div role="status" aria-live="polite" className="mt-2.5">
          <AnimatePresence mode="wait" initial={false}>
            {issue ? (
              <motion.div
                key={issue.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-red-200 bg-red-50 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug text-ink">{issue.message}</p>
                    {issue.fix && (
                      <button
                        type="button"
                        onClick={() => applyFix(issue)}
                        className="mt-2.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_0_0_4px] shadow-terracotta/20 transition hover:bg-forest-dark active:scale-95"
                      >
                        {issue.fix.label}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="clear"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5 rounded-2xl border border-forest/15 bg-forest/5 p-3"
              >
                <CheckCircle2 size={15} className="shrink-0 text-forest" />
                <p className="flex-1 text-[13px] text-forest">All clear. Times and gaps look fine.</p>
                <button
                  type="button"
                  onClick={() => setActivities(scenario.start)}
                  className="flex items-center gap-1.5 rounded-full border border-forest/20 px-3 py-1.5 text-xs font-medium text-forest transition hover:bg-forest hover:text-white active:scale-95"
                >
                  <RotateCcw size={12} /> Replay
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Budget card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.8, delay: 0.9 },
          y: reduce
            ? { duration: 0.8 }
            : { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.4 },
        }}
        className="relative mt-4 w-full rounded-2xl bg-cream p-4 text-ink shadow-2xl shadow-black/40 ring-1 ring-white/20 lg:absolute lg:-bottom-9 lg:-left-12 lg:mt-0 lg:w-56"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
            <Wallet size={13} className="text-terracotta" /> Budget
          </p>
          {budget.status !== 'no-budget' && (
            <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-medium text-forest">
              {statusLabel[budget.status]}
            </span>
          )}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mt-2 font-display text-2xl text-forest">
              {formatMoney(budget.remainingMinor ?? 0, scenario.currency)}
            </p>
            <p className="text-xs text-muted">
              left of {formatMoney(scenario.total, scenario.currency)}
            </p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-sand" aria-hidden="true">
              <div className="bg-forest" style={{ width: `${spentW}%` }} />
              <div className="bg-forest/30" style={{ width: `${plannedW}%` }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}