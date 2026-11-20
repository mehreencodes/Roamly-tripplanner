import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Bookmark, MapPin } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { useAuth } from '@/features/auth/authContext'
import { useSaved } from '@/features/saved/useSaved'
import type { Destination } from '@/types/destination'

export default function DestinationCard({ destination: d }: { destination: Destination }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isSaved, toggle } = useSaved()
  const saved = isSaved(d.slug)

  const handleSave = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    toggle(d.slug)
  }

  return (
    <article className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-forest-dark text-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <SmartImage
        src={d.image}
        alt={d.name}
        className="absolute inset-0 h-full w-full transition duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

      {/* Poora card clickable */}
      <Link
        to={`/destinations/${d.slug}`}
        aria-label={`Open ${d.name}`}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      />

      {/* Top-left: category */}
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium capitalize backdrop-blur-md">
        {d.category}
      </span>

      {/* Top-right: save */}
      <button
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${d.name} from saved` : `Save ${d.name}`}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition hover:bg-white/30 active:scale-90"
      >
        <Bookmark size={16} className={saved ? 'fill-current' : ''} />
      </button>

      {/* Bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-white/75">
          <MapPin size={12} /> {d.country}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <h3 className="font-display text-2xl leading-tight">{d.name}</h3>
          <ArrowUpRight
            size={20}
            className="mb-1 shrink-0 text-terracotta transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-white/75">{d.tagline}</p>
        <p className="mt-3 border-t border-white/15 pt-3 text-xs text-white/60">
          {d.attractions.length} places · Best {d.bestSeason}
        </p>
      </div>
    </article>
  )
}