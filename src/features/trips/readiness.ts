import type { Destination } from '@/types/destination'
import type { Trip } from '@/types/trip'
import { seasonCheck } from './tripUtils'

export interface ReadinessItem {
  id: 'season' | 'planned' | 'timed' | 'conflicts'
  label: string
  points: number
  max: number
  ok: boolean
  note: string
  /** Masla wala pehla din (0-based), taake wahan jump kar sakein */
  day?: number
}

const PER_ISSUE = 7
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** openIssues: checker ke woh issues jo dismiss nahi hue */
export function tripReadiness(trip: Trip, dest: Destination, openIssues: { day: number }[]) {
  const total = trip.days.length
  const activities = trip.days.flat()
  const hasActivities = activities.length > 0

  const emptyDays = trip.days.flatMap((d, i) => (d.length === 0 ? [i] : []))
  const filled = total - emptyDays.length

  const untimed = activities.filter((a) => a.startMin === null)
  const untimedDay = trip.days.findIndex((d) => d.some((a) => a.startMin === null))

  const season = seasonCheck(trip.startDate, total, dest.bestMonths)

  const items: ReadinessItem[] = [
    {
      id: 'season',
      label: 'Season',
      max: 20,
      points: Math.round((20 * (total - season.outside)) / total),
      ok: season.outside === 0,
      note:
        season.outside === 0
          ? `Dates fall in the best season (${dest.bestSeason}).`
          : season.all
            ? `Dates are outside the best season (${dest.bestSeason}).`
            : `${plural(season.outside, 'day')} outside the best season.`,
    },
    {
      id: 'planned',
      label: 'Days planned',
      max: 25,
      points: Math.round((25 * filled) / total),
      ok: emptyDays.length === 0,
      note:
        emptyDays.length === 0
          ? 'Every day has at least one activity.'
          : `${plural(emptyDays.length, 'day')} still empty.`,
      day: emptyDays[0],
    },
    {
      id: 'timed',
      label: 'Times set',
      max: 20,
      points: !hasActivities
        ? 0
        : Math.round((20 * (activities.length - untimed.length)) / activities.length),
      ok: hasActivities && untimed.length === 0,
      note: !hasActivities
        ? 'Add activities to set their times.'
        : untimed.length === 0
          ? 'All activities have a start time.'
          : `${plural(untimed.length, 'activity')} without a start time.`,
      day: untimed.length > 0 ? untimedDay : undefined,
    },
    {
      id: 'conflicts',
      label: 'Schedule conflicts',
      max: 35,
      points: !hasActivities ? 0 : Math.max(0, 35 - PER_ISSUE * openIssues.length),
      ok: hasActivities && openIssues.length === 0,
      note: !hasActivities
        ? 'Nothing to check yet.'
        : openIssues.length === 0
          ? 'No open issues in your schedule.'
          : `${plural(openIssues.length, 'open issue')} to review.`,
      day: openIssues[0]?.day,
    },
  ]

  const score = items.reduce((n, i) => n + i.points, 0)
  const status = score >= 80 ? 'Ready to go' : score >= 50 ? 'Almost there' : 'Getting started'

  return { score, status, items }
}

export type Readiness = ReturnType<typeof tripReadiness>