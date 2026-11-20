import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Briefcase, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/authContext'

export default function UserMenu({ glass }: { glass: boolean }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const name = user.displayName || user.email?.split('@')[0] || 'Traveler'
  const initial = name.charAt(0).toUpperCase()

  const avatar = user.photoURL ? (
    <img
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover"
    />
  ) : (
    initial
  )

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-terracotta text-sm font-semibold text-white ring-2 transition hover:scale-105 ${
          glass ? 'ring-white/40' : 'ring-sand'
        }`}
      >
        {avatar}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-sand bg-cream p-2 shadow-2xl shadow-forest/10"
          >
            {/* Naam + email: click karne par profile page */}
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-sand"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-terracotta text-sm font-semibold text-white">
                {avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{name}</span>
                <span className="block truncate text-xs text-muted">{user.email}</span>
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            <div className="my-1 h-px bg-sand" />
            <Link
              to="/trips"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-sand"
            >
              <Briefcase size={17} /> My Trips
            </Link>
            <Link
              to="/saved"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-sand"
            >
              <Bookmark size={17} /> Saved places
            </Link>
            <div className="my-1 h-px bg-sand" />
            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-sand"
            >
              <LogOut size={17} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}