import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const { pathname } = useLocation()
  // Home aur destination pages par hero navbar ke neeche tak jata hai
  const flushHero = pathname === '/' || pathname.startsWith('/destinations/')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${flushHero ? '' : 'pt-24'}`}>
        <Outlet />
      </main>
    </div>
  )
}