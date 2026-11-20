import { Link, Navigate } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { useAuth } from '@/features/auth/authContext'
import { useSaved } from '@/features/saved/useSaved'
import { destinations } from '@/data/destinations'
import DestinationCard from '@/features/discover/DestinationCard'

export default function SavedPage() {
  const { user, loading } = useAuth()
  const { saved } = useSaved()

  if (loading) return <div className="min-h-[60vh]" />
  if (!user) return <Navigate to="/auth" replace />

  const items = destinations.filter((d) => saved.includes(d.slug))

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <p className="text-xs uppercase tracking-widest text-terracotta">Your collection</p>
      <h1 className="mt-2 font-display text-5xl text-forest">Saved places</h1>

      {items.length === 0 ? (
        <div className="mx-auto mt-16 flex max-w-sm flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-forest">
            <Bookmark size={26} />
          </span>
          <h2 className="mt-5 font-display text-2xl text-forest">Nothing saved yet</h2>
          <p className="mt-2 text-muted">
            Tap Save on any destination and it will show up here.
          </p>
          <Link
            to="/explore"
            className="mt-6 rounded-full bg-terracotta px-7 py-3 font-medium text-white transition hover:bg-terracotta/90"
          >
            Explore destinations
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      )}
    </section>
  )
}