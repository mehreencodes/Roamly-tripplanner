import { lazy, Suspense } from 'react'
import Hero from '@/features/home/Hero'
import FeaturedDestinations from '@/features/home/FeaturedDestinations'

const ContinuePlanning = lazy(() => import('@/features/home/ContinuePlanning'))

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={null}>
        <ContinuePlanning />
      </Suspense>
      <FeaturedDestinations />
    </>
  )
}