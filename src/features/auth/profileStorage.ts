export interface TravelProfile {
  styles: string[]
  companions: string
  currency: string
  skipped: boolean
}

const key = (uid: string) => `roamly:profile:${uid}`

export function getProfile(uid: string): TravelProfile | null {
  try {
    const raw = localStorage.getItem(key(uid))
    return raw ? (JSON.parse(raw) as TravelProfile) : null
  } catch {
    return null
  }
}

export function saveProfile(uid: string, profile: TravelProfile) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(profile))
  } catch {
    // storage band ho (private mode) to bhi app chalti rahe
  }
}