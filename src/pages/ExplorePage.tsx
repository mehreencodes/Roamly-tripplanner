import { useEffect, useMemo, useState } from 'react'
import { Search, SearchX, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { destinations } from '@/data/destinations'
import DestinationCard from '@/features/discover/DestinationCard'
import type { Category } from '@/types/destination'

const categories: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mountain', label: 'Mountains' },
  { value: 'beach', label: 'Beaches' },
  { value: 'historical', label: 'Historical' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'nature', label: 'Nature' },
    { value: 'city', label: 'Cities' },
  { value: 'cultural', label: 'Culture' },
]

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [category, setCategory] = useState<Category | 'all'>('all')

  // search ko URL ke saath sync rakho (refresh par bhi rahe)
  useEffect(() => {
    const next = new URLSearchParams(params)
    if (query.trim()) next.set('q', query)
    else next.delete('q')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return destinations.filter((d) => {
      const matchesCategory = category === 'all' || d.category === category
      const matchesQuery =
        !q || d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  const hasFilters = query.trim() !== '' || category !== 'all'
  const reset = () => {
    setQuery('')
    setCategory('all')
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 sm:pt-8">
      {/* Header */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
            <span className="h-px w-8 bg-terracotta" />
            Discover
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest sm:text-5xl">
            Explore <em className="italic text-terracotta">destinations</em>
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            size={17}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places or countries"
            aria-label="Search destinations"
            className="h-12 w-full rounded-full border border-sand bg-white pl-11 pr-11 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-sand"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Category chips */}
      <div className="-mx-6 mt-8 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const active = category === c.value
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition active:scale-95 ${
                active
                  ? 'border-forest bg-forest text-white'
                  : 'border-sand bg-white text-forest hover:border-forest/40'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Result meta */}
      <div className="mt-8 flex items-center justify-between border-b border-sand pb-4">
        <p className="text-sm text-muted" aria-live="polite">
          {results.length} {results.length === 1 ? 'destination' : 'destinations'}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-terracotta underline-offset-4 transition hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="mx-auto mt-20 flex max-w-sm flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-forest">
            <SearchX size={26} />
          </span>
          <h2 className="mt-5 font-display text-2xl text-forest">Nothing matches</h2>
          <p className="mt-2 text-sm text-muted">
            Try a different name or switch the category.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white transition hover:bg-forest-dark active:scale-95"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      )}
    </section>
  )
}