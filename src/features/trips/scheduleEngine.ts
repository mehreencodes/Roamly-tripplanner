import { formatDuration } from '@/lib/format'
import { haversineKm, type LatLng } from '@/lib/geo'
import type { Attraction } from '@/types/destination'
import type { Activity, Trip } from '@/types/trip'
import { DAY_END_MIN, STEP_MIN, formatTime, nextStartMin } from './tripUtils'

export const RULES = {
  /** Do activities ke beech kam az kam waqfa (minutes) */
  minGapMin: 10,
  /** Is se zyada planned minutes wala din "bhara hua" hai */
  longDayMin: 9 * 60,
  /** Seedhi doori se asli sadak ki doori ka mota andaza (sadak seedhi nahi hoti) */
  roadFactor: 1.4,
  /** Mota ausat raftar (km/h). Yeh sirf andaza hai, route nahi */
  avgSpeedKmh: 40,
} as const

export type IssueType = 'overlap' | 'tight-gap' | 'overloaded' | 'unscheduled'
export type Severity = 'error' | 'warning' | 'info'

export type Fix =
  | { kind: 'shift'; activityId: string; startMin: number; label: string }
  | { kind: 'move-day'; activityId: string; toDay: number; label: string }

export interface Issue {
  /** Stable id: dismiss isi se yaad rakha jata hai. Halat badle to key badal jati hai */
  key: string
  type: IssueType
  severity: Severity
  day: number
  activityIds: string[]
  message: string
  detail?: string
  fix?: Fix
}

export type CoordsOf = (placeId: string) => LatLng | undefined

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 }

const roundUpTo = (n: number, step: number) => Math.ceil(n / step) * step
const loadOf = (day: Activity[]) => day.reduce((sum, a) => sum + a.durationMin, 0)

/** Seedhi doori se travel time ka andaza (5 min ke step mein) */
export function estimateTravelMin(km: number) {
  if (km < 0.3) return 0
  const raw = ((km * RULES.roadFactor) / RULES.avgSpeedKmh) * 60
  return Math.ceil(raw / 5) * 5
}

function travelBetween(a: Activity, b: Activity, coordsOf: CoordsOf) {
  const ca = a.placeId ? coordsOf(a.placeId) : undefined
  const cb = b.placeId ? coordsOf(b.placeId) : undefined
  if (!ca || !cb) return { km: null as number | null, minutes: 0 }
  const km = haversineKm(ca, cb)
  return { km, minutes: estimateTravelMin(km) }
}

function analyzeDay(
  day: Activity[],
  dayIndex: number,
  days: Activity[][],
  coordsOf: CoordsOf,
): Issue[] {
  const issues: Issue[] = []

  /* 1. Bina time wali activities */
  for (const a of day) {
    if (a.startMin !== null) continue
    const start = nextStartMin(
      day.filter((x) => x.id !== a.id),
      a.durationMin,
    )
    issues.push({
      key: `unscheduled:${a.id}`,
      type: 'unscheduled',
      severity: 'info',
      day: dayIndex,
      activityIds: [a.id],
      message: `${a.title} has no start time.`,
      detail: 'Activities without a time cannot be checked for clashes.',
      fix:
        start === null
          ? undefined
          : {
              kind: 'shift',
              activityId: a.id,
              startMin: start,
              label: `Start at ${formatTime(start)}`,
            },
    })
  }

  /* 2. Overlap aur kam gap: time ke hisaab se sort karke ek pass (sweep) */
  const timed = day
    .flatMap((a, index) =>
      a.startMin === null
        ? []
        : [{ a, index, start: a.startMin, end: a.startMin + a.durationMin }],
    )
    .sort((x, y) => x.start - y.start || x.index - y.index)

  if (timed.length >= 2) {
    let anchor = timed[0] // ab tak sab se der se khatam hone wali activity
    for (const cur of timed.slice(1)) {
      const gap = cur.start - anchor.end
      const travel = travelBetween(anchor.a, cur.a, coordsOf)
      const needed = Math.max(RULES.minGapMin, travel.minutes)

      if (gap < needed) {
        const start = roundUpTo(anchor.end + needed, STEP_MIN)
        const fits = start + cur.a.durationMin <= DAY_END_MIN
        const fix: Fix | undefined = fits
          ? {
              kind: 'shift',
              activityId: cur.a.id,
              startMin: start,
              label: `Move ${cur.a.title} to ${formatTime(start)}`,
            }
          : undefined
        const ids = [anchor.a.id, cur.a.id]
        const stamp = `${anchor.start}-${cur.start}`

                if (gap < 0) {
          const overlap = Math.min(anchor.end, cur.end) - cur.start
          issues.push({
            key: `overlap:${ids.join(':')}:${stamp}`,
            type: 'overlap',
            severity: 'error',
            day: dayIndex,
            activityIds: ids,
                          message: `${anchor.a.title} and ${cur.a.title} overlap by ${formatDuration(overlap)}.`,
            detail: `${cur.a.title} starts at ${formatTime(cur.start)}, but ${anchor.a.title} runs until ${formatTime(anchor.end)}.`,
            fix,
          })
        } else {
          issues.push({
            key: `gap:${ids.join(':')}:${stamp}`,
            type: 'tight-gap',
            severity: 'warning',
            day: dayIndex,
            activityIds: ids,
            message:
              gap === 0
                ? `No break between ${anchor.a.title} and ${cur.a.title}.`
                : `Only ${formatDuration(gap)} between ${anchor.a.title} and ${cur.a.title}.`,
            detail:
              travel.km !== null && travel.minutes > 0
                ? `About ${travel.km.toFixed(1)} km apart in a straight line. Allow roughly ${travel.minutes} min to get there (an estimate, not a route).`
                : `Leave at least ${RULES.minGapMin} min between activities.`,
            fix,
          })
        }
      }

      if (cur.end > anchor.end) anchor = cur
    }
  }

  /* 3. Bhara hua din */
  const planned = loadOf(day)
  if (planned > RULES.longDayMin) {
    const candidate = [...day].sort((x, y) => (y.startMin ?? -1) - (x.startMin ?? -1))[0]
    const target = days
      .map((d, i) => ({ i, load: loadOf(d) }))
      .filter((x) => x.i !== dayIndex && x.load + candidate.durationMin <= RULES.longDayMin)
      .sort((x, y) => x.load - y.load || x.i - y.i)[0]

    issues.push({
      key: `overload:${dayIndex}:${planned}`,
      type: 'overloaded',
      severity: 'warning',
      day: dayIndex,
      activityIds: day.map((a) => a.id),
      message: `Day ${dayIndex + 1} has ${formatDuration(planned)} of activities.`,
      detail: `Around ${formatDuration(RULES.longDayMin)} is a comfortable limit for one day.`,
      fix: target
        ? {
            kind: 'move-day',
            activityId: candidate.id,
            toDay: target.i,
            label: `Move ${candidate.title} to Day ${target.i + 1}`,
          }
        : undefined,
    })
  }

  return issues
}

export function analyzeDays(days: Activity[][], coordsOf: CoordsOf): Issue[] {
  return days
    .flatMap((day, i) => analyzeDay(day, i, days, coordsOf))
    .sort((a, b) => a.day - b.day || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

/** App ke liye: destination ki attractions se coordinates lekar poori trip check karta hai */
export function analyzeTrip(trip: Pick<Trip, 'days'>, attractions: Attraction[]): Issue[] {
  const coords = new Map(attractions.map((a) => [a.id, a.coordinates]))
  return analyzeDays(trip.days, (id) => coords.get(id))
}