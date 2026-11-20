export interface Activity {
  id: string
  /** Destination attraction ka id. Custom activity (lunch, hotel) ke liye null */
  placeId: string | null
  title: string
  /** Din ke shuru se minutes (09:00 = 540). null = abhi time set nahi */
  startMin: number | null
  durationMin: number
}

export interface Trip {
  id: string
  uid: string
  destinationSlug: string
  title: string
  /** YYYY-MM-DD */
  startDate: string
  /** Har din ki activities, user ke order mein */
  days: Activity[][]
  createdAt: number
  /** Jin checker suggestions ko user ne reject kiya (Issue.key) */
  dismissedIssues?: string[]
}