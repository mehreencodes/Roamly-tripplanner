import { auth } from '@/lib/firebase'
import type { TripBudget } from '@/types/budget'
import type { Trip } from '@/types/trip'

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')

/** VITE_API_URL na ho to sync band rehta hai aur app sirf local chalti hai */
export const apiEnabled = Boolean(BASE)

export type RemoteTrip = Trip & { budget?: TripBudget }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new ApiError(0, 'API is not configured')

  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new ApiError(401, 'Not signed in')

  // Free server soya hua ho to pehli request 30 se 60 second le sakti hai
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 70_000)

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`)
    }
    return (res.status === 204 ? undefined : await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchTrips() {
  const data = await request<unknown>('/api/trips')
  if (!Array.isArray(data)) throw new ApiError(502, 'Unexpected response')
  return data as RemoteTrip[]
}

export const putTrip = (payload: { id: string }) =>
  request<void>(`/api/trips/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) })

export const deleteTrip = (id: string) => request<void>(`/api/trips/${id}`, { method: 'DELETE' })