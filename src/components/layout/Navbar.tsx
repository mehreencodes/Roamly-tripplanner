import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import Logo from './Logo'
import UserMenu from './UserMenu'
import { useAuth } from '@/features/auth/authContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/trips', label: 'My Trips' },
  { to: '/saved', label: 'Saved' },
]

const isActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname.startsWith(to)

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, loading } = useAuth()
  const isHome = pathname === '/' || pathname.startsWith('/destinations/')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  const glass = isHome && !scrolled && !open
  const activeTo = links.find((l) => isActive(pathname, l.to))?.to ?? null
  const pillTo = hovered ?? activeTo

  const signInClass = `rounded-full border text-sm font-medium transition active:scale-95 ${
    glass
      ? 'border-white/30 text-white hover:bg-white/10'
      : 'border-forest/20 text-forest hover:bg-sand'
  }`

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto max-w-6xl rounded-full border transition-all duration-300 ${
          glass
            ? 'border-white/20 bg-white/10 backdrop-blur-xl'
            : 'border-sand bg-cream/85 shadow-lg shadow-forest/5 backdrop-blur-xl'
        }`}
      >
        <nav className="flex h-14 items-center justify-between pl-4 pr-2 sm:pl-5">
          <Link to="/" aria-label="Roamly home">
            <Logo light={glass} />
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center md:flex" onMouseLeave={() => setHovered(null)}>
            {links.map((l) => {
              const active = isActive(pathname, l.to)
              const on = pillTo === l.to
              return (
                <li key={l.to} onMouseEnter={() => setHovered(l.to)}>
                  <Link
                    to={l.to}
                    onFocus={() => setHovered(l.to)}
                    onBlur={() => setHovered(null)}
                    aria-current={active ? 'page' : undefined}
                    className={`relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      glass
                        ? on ? 'text-white' : 'text-white/65'
                        : on ? 'text-forest' : 'text-ink/60'
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-full ${glass ? 'bg-white/15' : 'bg-sand'}`}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{l.label}</span>
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-terracotta" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            {loading ? (
              <div className="h-10 w-24" />
            ) : user ? (
              <UserMenu glass={glass} />
            ) : (
              <Link to="/auth" className={`${signInClass} px-5 py-2`}>
                Sign in
              </Link>
            )}
            
            <Link
  to="/trips/new"
  className="group flex items-center gap-1.5 rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
>
              Start planning
              <ArrowUpRight
                size={16}
                className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {/* Mobile: Sign in / avatar toggle ke BAHAR */}
          <div className="flex items-center gap-1.5 md:hidden">
            {!loading &&
              (user ? (
                <UserMenu glass={glass} />
              ) : (
                <Link to="/auth" className={`${signInClass} px-4 py-1.5`}>
                  Sign in
                </Link>
              ))}
            <button
              className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                glass ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-sand'
              }`}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-2 max-w-6xl rounded-3xl border border-sand bg-cream p-3 shadow-xl md:hidden"
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`block rounded-2xl px-4 py-3 text-lg font-medium transition hover:bg-sand ${
                  isActive(pathname, l.to) ? 'bg-sand text-forest' : 'text-ink'
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* <Link
              to="/explore"
              className="mt-2 block rounded-full bg-terracotta px-5 py-3 text-center font-medium text-white"
            >
              Start planning
            </Link> */}
            <Link
  to="/trips/new"
  className="mt-2 block rounded-full bg-terracotta px-5 py-3 text-center font-medium text-white"
>
  Start planning
</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}