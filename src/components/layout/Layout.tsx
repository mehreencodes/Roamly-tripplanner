import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import { findDestination } from '@/features/trips/tripUtils'
import usePageTitle from '@/lib/usePageTitle'
import Footer from './Footer'
import SyncStatus from '@/features/sync/SyncStatus'

const SITE = 'Roamly'

function titleFor(pathname: string) {
  if (pathname === '/') return `${SITE} | Plan together. Travel better.`

  if (pathname.startsWith('/destinations/')) {
    const dest = findDestination(pathname.split('/')[2])
    return dest ? `${dest.name}, ${dest.country} · ${SITE}` : `Destination · ${SITE}`
  }

  if (pathname === '/explore') return `Explore destinations · ${SITE}`
  if (pathname === '/saved') return `Saved places · ${SITE}`
  if (pathname === '/profile') return `Profile · ${SITE}`
  if (pathname === '/trips') return `My trips · ${SITE}`
  if (pathname === '/trips/new') return `Plan a trip · ${SITE}`
  if (pathname.startsWith('/trips/') && pathname.endsWith('/budget')) return `Trip budget · ${SITE}`
  if (pathname.startsWith('/trips/')) return `Trip planner · ${SITE}`

  // Layout ke andar koi aur route match nahi hota to wo 404 page hai
  return `Page not found · ${SITE}`
}

export default function Layout() {
  const { pathname } = useLocation()
  // Home aur destination pages par hero navbar ke neeche tak jata hai
  const flushHero = pathname === '/' || pathname.startsWith('/destinations/')

  usePageTitle(titleFor(pathname))

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className={`flex-1 ${flushHero ? '' : 'pt-24'}`}>
        <Outlet />
      </main>
       <Footer />
        <SyncStatus />
    </div>
  )
}