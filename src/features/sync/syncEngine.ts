import { useSyncExternalStore } from 'react'
import { ApiError, apiEnabled, deleteTrip, fetchTrips, putTrip, type RemoteTrip } from '@/lib/api'
import { getAllBudgets, mergeBudgets, subscribeBudgets } from '@/features/budget/budgetStore'
import { getAllTrips, replaceUserTrips, subscribeTrips } from '@/features/trips/tripStore'
import type { TripBudget } from '@/types/budget'
import type { Trip } from '@/types/trip'

/* --------------------------------- Status --------------------------------- */

export interface SyncStatus {
  phase: 'idle' | 'syncing' | 'saving' | 'error'
  /** Request 4 second se zyada le rahi hai (free server soya hua ho sakta hai) */
  slow: boolean
  message?: string
}

const IDLE: SyncStatus = { phase: 'idle', slow: false }
let status: SyncStatus = IDLE
const statusListeners = new Set<() => void>()

function setStatus(next: SyncStatus) {
  status = next
  statusListeners.forEach((l) => l())
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeStatus, () => status)
}

let slowTimer: ReturnType<typeof setTimeout> | undefined

function beginBusy(phase: 'syncing' | 'saving') {
  clearTimeout(slowTimer)
  setStatus({ phase, slow: false })
  slowTimer = setTimeout(() => {
    if (status.phase === phase) setStatus({ phase, slow: true })
  }, 4000)
}

function endBusy() {
  clearTimeout(slowTimer)
}

/* ------------------------- Browser mein yaadasht -------------------------- */
/* known: server par confirm trips, dirty: save hona baqi, deleted: delete hona baqi */

interface Persisted {
  known: string[]
  dirty: string[]
  deleted: string[]
}

const storageKey = (id: string) => `roamly:sync:v1:${id}`

function loadState(id: string): Persisted {
  try {
    const raw = localStorage.getItem(storageKey(id))
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>
      return { known: p.known ?? [], dirty: p.dirty ?? [], deleted: p.deleted ?? [] }
    }
  } catch {
    /* corrupt ya blocked storage: khali se shuru */
  }
  return { known: [], dirty: [], deleted: [] }
}

const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])
const without = (list: string[], id: string) => list.filter((x) => x !== id)

/* --------------------------------- Engine --------------------------------- */

let uid: string | null = null
let state: Persisted = { known: [], dirty: [], deleted: [] }
let hydrated = false
let hydrating = false
let flushing = false
let suppress = false
let attempt = 0
let flushTimer: ReturnType<typeof setTimeout> | undefined
let retryTimer: ReturnType<typeof setTimeout> | undefined
let lastTrips = new Map<string, Trip>()
let lastBudgets: Record<string, TripBudget> = {}
let unsubs: (() => void)[] = []

function persist() {
  if (!uid) return
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state))
  } catch {
    /* storage full ya blocked: memory mein chalta rahe */
  }
}

function snapshot() {
  lastTrips = new Map(
    getAllTrips()
      .filter((t) => t.uid === uid)
      .map((t): [string, Trip] => [t.id, t]),
  )
  lastBudgets = getAllBudgets()
}

const isRetryable = (e: unknown) =>
  !(e instanceof ApiError) || e.status === 0 || e.status === 401 || e.status === 429 || e.status >= 500

function toPayload(trip: Trip, budget: TripBudget | undefined) {
  const { uid: _uid, ...rest } = trip
  return budget ? { ...rest, budget } : rest
}

function scheduleFlush(delay = 800) {
  clearTimeout(flushTimer)
  flushTimer = setTimeout(() => void flush(), delay)
}

function scheduleRetry() {
  clearTimeout(retryTimer)
  attempt += 1
  const delay = Math.min(60_000, 5_000 * 3 ** (attempt - 1))
  retryTimer = setTimeout(() => retrySync(), delay)
}

function handleFailure(e: unknown) {
  const refused = e instanceof ApiError && e.status > 0 && !isRetryable(e)
  setStatus({
    phase: 'error',
    slow: false,
    message: refused
      ? `The server refused a request (${e.status}: ${e.message}).`
      : "Can't reach the server. Your changes are kept on this device and will sync later.",
  })
  if (isRetryable(e)) scheduleRetry()
  else console.warn('Sync stopped:', e)
}
function markDirty(id: string) {
  state.dirty = add(state.dirty, id)
  persist()
  scheduleFlush()
}

function markDeleted(id: string) {
  state.dirty = without(state.dirty, id)
  // Jo trip kabhi server par gayi hi nahi, uska delete bhejne ki zaroorat nahi
  if (state.known.includes(id)) state.deleted = add(state.deleted, id)
  persist()
  scheduleFlush()
}

function onTripsChange() {
  if (!uid || suppress) return
  const now = new Map(
    getAllTrips()
      .filter((t) => t.uid === uid)
      .map((t): [string, Trip] => [t.id, t]),
  )
  for (const [id, trip] of now) if (lastTrips.get(id) !== trip) markDirty(id)
  for (const id of lastTrips.keys()) if (!now.has(id)) markDeleted(id)
  lastTrips = now
}

function onBudgetsChange() {
  if (!uid || suppress) return
  const now = getAllBudgets()
  for (const id of Object.keys(now)) {
    if (lastBudgets[id] !== now[id] && lastTrips.has(id)) markDirty(id)
  }
  lastBudgets = now
}

async function flush() {
  const current = uid
  if (!current || !hydrated || flushing) return

  if (state.dirty.length === 0 && state.deleted.length === 0) {
    if (status.phase !== 'idle') setStatus(IDLE)
    return
  }

  flushing = true
  beginBusy('saving')
  let failure: unknown = null
  let rejected = 0

  try {
    for (const id of [...state.deleted]) {
      await deleteTrip(id)
      if (uid !== current) return
      state.deleted = without(state.deleted, id)
      state.known = without(state.known, id)
      persist()
    }

    for (const id of [...state.dirty]) {
      const trip = getAllTrips().find((t) => t.id === id && t.uid === current)
      if (!trip) {
        state.dirty = without(state.dirty, id)
        continue
      }
      const budget = getAllBudgets()[id]

      try {
        await putTrip(toPayload(trip, budget))
      } catch (e) {
        if (isRetryable(e)) throw e
        // Server ne data rad kiya (400 jaisa): is trip par atak kar baqi na rokein
        console.warn('Server rejected a trip', id, e)
        rejected += 1
        state.dirty = without(state.dirty, id)
        persist()
        continue
      }

      if (uid !== current) return
      state.known = add(state.known, id)
      // Request ke dauran edit hui ho to dobara bhejni hai
      const unchanged =
        getAllTrips().find((t) => t.id === id) === trip && getAllBudgets()[id] === budget
      if (unchanged) state.dirty = without(state.dirty, id)
      persist()
    }
  } catch (e) {
    failure = e
  } finally {
    flushing = false
    endBusy()
  }

  if (failure) {
    handleFailure(failure)
    return
  }

  attempt = 0
  const pending = state.dirty.length > 0 || state.deleted.length > 0
  if (pending) scheduleFlush(300)
  if (rejected > 0) {
    setStatus({ phase: 'error', slow: false, message: 'Some changes could not be saved.' })
  } else if (!pending) {
    setStatus(IDLE)
  }
}

async function hydrate() {
  const current = uid
  if (!current || hydrating) return

  hydrating = true
  beginBusy('syncing')

  let remote: RemoteTrip[]
  try {
    remote = await fetchTrips()
  } catch (e) {
    hydrating = false
    endBusy()
    if (uid === current) handleFailure(e)
    return
  }

  hydrating = false
  endBusy()
  if (uid !== current) return

  const localTrips = getAllTrips().filter((t) => t.uid === current)
  const localById = new Map(localTrips.map((t): [string, Trip] => [t.id, t]))
  const remoteIds = new Set(remote.map((t) => t.id))
  const localBudgets = getAllBudgets()

  const merged: Trip[] = []
  const budgetUpdates: Record<string, TripBudget> = {}
  const upload = new Set<string>()

  for (const r of remote) {
    if (state.deleted.includes(r.id)) continue // delete abhi server tak nahi pohancha

    const local = localById.get(r.id)
    if (local && state.dirty.includes(r.id)) {
      merged.push(local) // local ki unsaved tabdeeli jeetti hai
      upload.add(r.id)
      continue
    }

    const { budget, ...trip } = r
    merged.push({ ...trip, uid: current })
    if (budget) budgetUpdates[r.id] = budget
    else if (localBudgets[r.id]) upload.add(r.id) // budget sirf local par hai
  }

  for (const local of localTrips) {
    if (remoteIds.has(local.id)) continue
    const dirty = state.dirty.includes(local.id)
    // Pehle server par thi, ab nahi: doosre device par delete hui
    if (state.known.includes(local.id) && !dirty) continue
    merged.push(local) // nayi (kabhi sync nahi hui) ya edit-shuda trip
    upload.add(local.id)
  }

  suppress = true
  try {
    replaceUserTrips(current, merged)
    if (Object.keys(budgetUpdates).length > 0) mergeBudgets(budgetUpdates)
  } finally {
    suppress = false
  }
  snapshot()

  state.known = remote.map((t) => t.id).filter((id) => !state.deleted.includes(id))
  state.dirty = [...upload]
  persist()

  hydrated = true
  attempt = 0
  setStatus(IDLE)
  void flush()
}

/** "Retry" button aur online hone par */
export function retrySync() {
  clearTimeout(retryTimer)
  if (!uid) return
  if (hydrated) void flush()
  else void hydrate()
}

const retryIfNeeded = () => {
  if (status.phase === 'error') retrySync()
}
const onVisible = () => {
  if (document.visibilityState === 'visible') retryIfNeeded()
}

export function startSync(userId: string) {
  if (!apiEnabled) return
  stopSync()
  uid = userId
  state = loadState(userId)
  hydrated = false
  attempt = 0
  snapshot()
  unsubs = [subscribeTrips(onTripsChange), subscribeBudgets(onBudgetsChange)]
  window.addEventListener('online', retryIfNeeded)
  document.addEventListener('visibilitychange', onVisible)
  void hydrate()
}

export function stopSync() {
  clearTimeout(flushTimer)
  clearTimeout(retryTimer)
  endBusy()
  unsubs.forEach((u) => u())
  unsubs = []
  window.removeEventListener('online', retryIfNeeded)
  document.removeEventListener('visibilitychange', onVisible)
  uid = null
  hydrated = false
  hydrating = false
  setStatus(IDLE)
}