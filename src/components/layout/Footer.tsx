import { Link } from 'react-router-dom'
import Logo from './Logo'

const links = [
  { to: '/explore', label: 'Explore' },
  { to: '/trips', label: 'My Trips' },
  { to: '/saved', label: 'Saved' },
]

export default function Footer() {
  return (
    <footer className="border-t border-sand">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/" aria-label="Roamly home" className="block w-fit">
            <Logo />
          </Link>
          <p className="mt-3 text-sm text-muted">Plan together. Travel better.</p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-forest"
        >
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="transition hover:text-terracotta">
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/mehreencodes/Roamly-tripplanner"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-terracotta"
          >
            GitHub
          </a>
        </nav>
      </div>

      <p className="border-t border-sand px-6 py-4 text-center text-xs text-muted">
        Photos from Unsplash. Map data © OpenStreetMap contributors.
      </p>
    </footer>
  )
}