import { useMemo, useSyncExternalStore } from 'react'
import { useAuth } from '@/features/auth/authContext'
import type { Activity, Trip } from '@/types/trip'
import {
  DAY_END_MIN,
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  clampTiming,
  findDestination,
  nextStartMin,
} from './tripUtils'

const KEY = 'roamly:trips:v2'
const LEGACY_KEY = 'roamly:trips'

/* v1 mein har din sirf attraction ids ki list tha */
type LegacyTrip = Omit<Trip, 'days'> & { days: string[][] }

function migrate(legacy: LegacyTrip[]): Trip[] {
  return legacy.map((t) => {
    const attractions = findDestination(t.destinationSlug)?.attractions ?? []
    const days = t.days.map((ids) => {
      const day: Activity[] = []
      for (const placeId of ids) {
        const place = attractions.find((a) => a.id === placeId)
        if (!place) continue
        day.push({
          id: crypto.randomUUID(),
          placeId,
          title: place.name,
          startMin: nextStartMin(day, place.durationMin),
          durationMin: place.durationMin,
        })
      }
      return day
    })
    return { ...t, days }
  })
}

function read(): Trip[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Trip[]

    const legacyRaw = localStorage.getItem(LEGACY_KEY)
    if (legacyRaw) {
      const migrated = migrate(JSON.parse(legacyRaw) as LegacyTrip[])
      localStorage.setItem(KEY, JSON.stringify(migrated)) // purani key backup ke taur par rehne di
      return migrated
    }
  } catch {
    /* corrupt ya blocked storage: khali se shuru */
  }
  return []
}

let trips: Trip[] = read()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function commit(next: Trip[]) {
  trips = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full ya blocked: memory mein chalta rahe */
  }
  notify()
}

// Doosre tab mein badlav ho to yahan bhi nazar aaye
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    trips = read()
    notify()
  }
})

function mutate(id: string, fn: (t: Trip) => Trip) {
  commit(trips.map((t) => (t.id === id ? fn(t) : t)))
}

function mutateDay(id: string, dayIndex: number, fn: (day: Activity[]) => Activity[]) {
  mutate(id, (t) => ({
    ...t,
    days: t.days.map((list, i) => (i === dayIndex ? fn(list) : list)),
  }))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => trips
/** Sync engine ke liye */
export const getAllTrips = () => trips
export const subscribeTrips = subscribe
export function replaceUserTrips(uid: string, next: Trip[]) {
  commit([...next, ...trips.filter((t) => t.uid !== uid)])
}

/** Sirf current logged-in user ki trips */
export function useTrips() {
  const { user } = useAuth()
  const all = useSyncExternalStore(subscribe, getSnapshot)
  const uid = user?.uid
  return useMemo(() => (uid ? all.filter((t) => t.uid === uid) : []), [all, uid])
}

export const tripActions = {
  create(input: {
    uid: string
    destinationSlug: string
    title: string
    startDate: string
    dayCount: number
  }) {
    const trip: Trip = {
      id: crypto.randomUUID(),
      uid: input.uid,
      destinationSlug: input.destinationSlug,
      title: input.title,
      startDate: input.startDate,
      days: Array.from({ length: Math.min(30, Math.max(1, input.dayCount)) }, () => []),
      createdAt: Date.now(),
    }
    commit([trip, ...trips])
    return trip.id
  },

  remove(id: string) {
    commit(trips.filter((t) => t.id !== id))
  },

  /** Place trip mein ek hi baar rehti hai. Dusre din mein ho to wahan se move hoti hai (duration wahi rehti hai) */
  addPlace(id: string, dayIndex: number, placeId: string) {
    mutate(id, (t) => {
      const place = findDestination(t.destinationSlug)?.attractions.find((a) => a.id === placeId)
      if (!place) return t

      const existing = t.days.flat().find((a) => a.placeId === placeId)
      const days = t.days.map((list) => list.filter((a) => a.placeId !== placeId))
      const target = days[dayIndex]
      if (!target) return t

      const base: Activity = existing ?? {
        id: crypto.randomUUID(),
        placeId,
        title: place.name,
        startMin: null,
        durationMin: place.durationMin,
      }
      days[dayIndex] = [...target, { ...base, startMin: nextStartMin(target, base.durationMin) }]
      return { ...t, days }
    })
  },

  removeActivity(id: string, dayIndex: number, activityId: string) {
    mutateDay(id, dayIndex, (list) => list.filter((a) => a.id !== activityId))
  },
  /** Apni activity (hotel, lunch, travel). Time na ho to pichli activity ke baad khud lag jata hai */
  addCustom(
    id: string,
    dayIndex: number,
    input: { title: string; startMin: number | null; durationMin: number },
  ) {
    mutateDay(id, dayIndex, (list) => {
      const title = input.title.trim().slice(0, 60)
      if (!title) return list
      const durationMin = Math.min(MAX_DURATION_MIN, Math.max(MIN_DURATION_MIN, input.durationMin))
      const startMin = input.startMin ?? nextStartMin(list, durationMin)
      return [
        ...list,
        clampTiming({ id: crypto.randomUUID(), placeId: null, title, startMin, durationMin }),
      ]
    })
  },

  renameActivity(id: string, dayIndex: number, activityId: string, title: string) {
    const next = title.trim().slice(0, 60)
    if (!next) return
    mutateDay(id, dayIndex, (list) =>
      list.map((a) => (a.id === activityId ? { ...a, title: next } : a)),
    )
  },
  /** Position ke saath start time bhi swap hota hai, taake "upar" ka matlab "pehle" ho */
  moveActivity(id: string, dayIndex: number, index: number, dir: -1 | 1) {
    mutateDay(id, dayIndex, (list) => {
      const to = index + dir
      if (to < 0 || to >= list.length) return list

      const a = list[index]
      const b = list[to]
      const fits = (x: Activity) => x.startMin === null || x.startMin + x.durationMin <= DAY_END_MIN
      const swappedA = { ...a, startMin: b.startMin }
      const swappedB = { ...b, startMin: a.startMin }
      const swapTimes = fits(swappedA) && fits(swappedB)

      const next = [...list]
      next[index] = swapTimes ? swappedB : b
      next[to] = swapTimes ? swappedA : a
      return next
    })
  },
  updateActivity(
    id: string,
    dayIndex: number,
    activityId: string,
    patch: Partial<Pick<Activity, 'startMin' | 'durationMin'>>,
  ) {
    mutateDay(id, dayIndex, (list) =>
      list.map((a) => (a.id === activityId ? clampTiming({ ...a, ...patch }) : a)),
    )
  },

  /** Activity ko dusre din ke aakhir mein bhejta hai, time khud lagta hai */
  moveToDay(id: string, fromDay: number, activityId: string, toDay: number) {
    mutate(id, (t) => {
      const activity = t.days[fromDay]?.find((a) => a.id === activityId)
      const target = t.days[toDay]
      if (!activity || !target || fromDay === toDay) return t

      const days = t.days.map((list, i) =>
        i === fromDay ? list.filter((a) => a.id !== activityId) : list,
      )
      days[toDay] = [...target, { ...activity, startMin: nextStartMin(target, activity.durationMin) }]
      return { ...t, days }
    })
  },

  dismissIssue(id: string, key: string) {
    mutate(id, (t) => ({
      ...t,
      dismissedIssues: [...new Set([...(t.dismissedIssues ?? []), key])],
    }))
  },

  restoreIssues(id: string) {
    mutate(id, (t) => ({ ...t, dismissedIssues: [] }))
  },
}