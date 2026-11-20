import { destinations } from '@/data/destinations'
import type { Activity, Trip } from '@/types/trip'

export const findDestination = (slug: string) => destinations.find((d) => d.slug === slug)

/* ---------------------------------- Dates --------------------------------- */

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d
}

export const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const fmtDay = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function dateRange(trip: Trip) {
  const start = addDays(trip.startDate, 0)
  const end = addDays(trip.startDate, trip.days.length - 1)
  return trip.days.length === 1 ? fmtShort(start) : `${fmtShort(start)} – ${fmtShort(end)}`
}

export function isPast(trip: Trip) {
  const end = addDays(trip.startDate, trip.days.length - 1)
  return end.getTime() < new Date().setHours(0, 0, 0, 0)
}

export const todayISO = () => new Date().toLocaleDateString('en-CA')

/** Trip ke kitne din best season ke mahinon se bahar hain */
export function seasonCheck(startISO: string, dayCount: number, bestMonths: number[]) {
  let outside = 0
  for (let i = 0; i < dayCount; i++) {
    if (!bestMonths.includes(addDays(startISO, i).getMonth() + 1)) outside++
  }
  return { outside, all: outside === dayCount }
}

/* ------------------------ Time of day (minutes) --------------------------- */

export const DAY_START_MIN = 9 * 60
export const DAY_END_MIN = 24 * 60
export const BUFFER_MIN = 30
export const STEP_MIN = 15
export const MIN_DURATION_MIN = 15
export const MAX_DURATION_MIN = 12 * 60

const roundUp = (n: number, step = STEP_MIN) => Math.ceil(n / step) * step

/** 540 -> "09:00" */
export function minToTime(min: number) {
  const clamped = Math.min(Math.max(Math.round(min), 0), DAY_END_MIN)
  if (clamped === DAY_END_MIN) return '24:00'
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

/** Screen par dikhane ke liye, browser ke format ke mutabiq. Input ki value ke liye minToTime use karo */
export function formatTime(min: number) {
  const clamped = Math.min(Math.max(Math.round(min), 0), DAY_END_MIN)
  return timeFormatter.format(new Date(2000, 0, 1, 0, clamped))
}
/** "09:00" -> 540. Ghalat ya khali value par null */
export function timeToMin(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  return h > 23 || m > 59 ? null : h * 60 + m
}

export const endMin = (a: Activity) => (a.startMin === null ? null : a.startMin + a.durationMin)

/** Activity ka time din ke andar rakhta hai (00:00 se 24:00) aur duration ki hadd lagata hai */
export function clampTiming(a: Activity): Activity {
  const duration = Math.min(MAX_DURATION_MIN, Math.max(MIN_DURATION_MIN, a.durationMin))
  if (a.startMin === null) return { ...a, durationMin: duration }
  const start = Math.min(Math.max(0, a.startMin), DAY_END_MIN - MIN_DURATION_MIN)
  return { ...a, startMin: start, durationMin: Math.min(duration, DAY_END_MIN - start) }
}

/** Naye activity ke liye start: pichli activity ke end ke baad buffer, warna 09:00. Din mein na aaye to null */
export function nextStartMin(day: Activity[], durationMin: number): number | null {
  const ends = day.flatMap((a) => {
    const end = endMin(a)
    return end === null ? [] : [end]
  })
  const start = ends.length === 0 ? DAY_START_MIN : roundUp(Math.max(...ends) + BUFFER_MIN)
  return start + durationMin <= DAY_END_MIN ? start : null
}

/** Duration stepper: chhoti activity 15 min, lambi 30 min ke step se */
export function durationStep(durationMin: number, dir: 1 | -1) {
  const long = dir === 1 ? durationMin >= 120 : durationMin > 120
  return long ? 30 : STEP_MIN
}

export function dayStats(day: Activity[]) {
  const starts = day.flatMap((a) => (a.startMin === null ? [] : [a.startMin]))
  const ends = day.flatMap((a) => {
    const end = endMin(a)
    return end === null ? [] : [end]
  })
  return {
    plannedMin: day.reduce((sum, a) => sum + a.durationMin, 0),
    first: starts.length > 0 ? Math.min(...starts) : null,
    last: ends.length > 0 ? Math.max(...ends) : null,
    unscheduled: day.length - starts.length,
  }
}