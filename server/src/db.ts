import { MongoClient, type Collection } from 'mongodb'
import { config } from './config.js'
import type { TripInput } from './schemas.js'

export type TripDoc = Omit<TripInput, 'id'> & {
  _id: string
  uid: string
  updatedAt: Date
}

const client = new MongoClient(config.mongoUri)
let tripsCol: Collection<TripDoc>

export async function connectDb() {
  await client.connect()
  tripsCol = client.db().collection<TripDoc>('trips')
  await tripsCol.createIndex({ uid: 1, updatedAt: -1 })
}

export const trips = () => tripsCol

/** Database ka document frontend ki Trip shape mein */
export function toTrip(doc: TripDoc) {
  const { _id, updatedAt: _updatedAt, ...rest } = doc
  return { id: _id, ...rest }
}