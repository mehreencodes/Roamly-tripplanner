import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
      <p className="font-display text-8xl leading-none text-terracotta/80">404</p>
      <h1 className="mt-5 font-display text-4xl text-forest">This page took a wrong turn</h1>
      <p className="mt-3 text-muted">
        The link may be broken, or the page may have moved. Let's get you back on the route.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
        >
          Back home
        </Link>
        <Link
          to="/explore"
          className="rounded-full border border-forest/20 px-6 py-3 text-sm font-medium text-forest transition hover:bg-sand active:scale-95"
        >
          Explore destinations
        </Link>
      </div>
    </section>
  )
}