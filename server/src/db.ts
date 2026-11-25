import { MongoClient, type Collection } from 'mongodb'
import { config } from './config.js'
import type { TripInput } from './schemas.js'

export type TripDoc = Omit<TripInput, 'id'> & {
  _id: string
  uid: string
  updatedAt: Date
  shareToken?: string
}

const client = new MongoClient(config.mongoUri)
let tripsCol: Collection<TripDoc>

export async function connectDb() {
  await client.connect()
  tripsCol = client.db().collection<TripDoc>('trips')
  await tripsCol.createIndex({ uid: 1, updatedAt: -1 })
  await tripsCol.createIndex(
    { shareToken: 1 },
    { unique: true, partialFilterExpression: { shareToken: { $type: 'string' } } },
  )
}

export const trips = () => tripsCol

/** Owner ke liye: frontend ki Trip shape (shareToken yahan se nahi jata) */
export function toTrip(doc: TripDoc) {
  const { _id, updatedAt: _updatedAt, shareToken: _shareToken, ...rest } = doc
  return { id: _id, ...rest }
}

/** Public link ke liye: sirf yeh fields, uid aur budget kabhi nahi */
export function toPublicTrip(doc: TripDoc) {
  return {
    destinationSlug: doc.destinationSlug,
    title: doc.title,
    startDate: doc.startDate,
    days: doc.days,
    createdAt: doc.createdAt,
  }
}