export type Category =
  | 'beach'
  | 'mountain'
  | 'historical'
  | 'adventure'
  | 'nature'
  | 'city'
  | 'cultural'

export type AttractionKind =
  | 'heritage'
  | 'nature'
  | 'viewpoint'
  | 'culture'
  | 'adventure'
  | 'food'

export interface Attraction {
  id: string
  name: string
  kind: AttractionKind
  description: string
  durationMin: number // schedule checker isi ko use karega
  coordinates: { lat: number; lng: number }
}

export interface Destination {
  id: string
  slug: string
  name: string
  country: string
  category: Category
  tagline: string
  description: string
  image: string
  gallery: string[]
  highlights: string[]
  attractions: Attraction[]
  coordinates: { lat: number; lng: number }
  bestSeason: string
  bestMonths: number[] 
}