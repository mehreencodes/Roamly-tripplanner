import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { CalendarCheck, Users, Wallet } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import SmartImage from '@/components/ui/SmartImage'
import { authImage } from '@/data/images'
import { useAuth } from '@/features/auth/authContext'
import AuthForm, { type AuthMode } from '@/features/auth/AuthForm'
import { getProfile } from '@/features/auth/profileStorage'

const points = [
  { icon: CalendarCheck, text: 'Day-by-day itineraries that flag clashes' },
  { icon: Wallet, text: 'Shared costs split fairly, to the last paisa' },
  { icon: Users, text: 'Plan together with friends and family' },
]

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [params, setParams] = useSearchParams()
  const mode: AuthMode = params.get('mode') === 'signup' ? 'signup' : 'login'

  if (!loading && user) {
  return <Navigate to={getProfile(user.uid) ? '/explore' : '/welcome'} replace />
}

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: photo panel */}
      <aside className="relative hidden overflow-hidden bg-forest-dark lg:sticky lg:top-0 lg:block lg:h-screen">
        <SmartImage src={authImage} alt="" className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-terracotta/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

        <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-14">
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/70">
            <span className="h-px w-8 bg-terracotta" />
            Roamly
          </p>

          <h2 className="mt-5 font-display text-5xl leading-[1.05] tracking-tight xl:text-6xl">
            Every great trip
            <br />
            starts with a <em className="italic text-terracotta">plan.</em>
          </h2>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
            One calm place to discover destinations, build your itinerary and share the costs.
          </p>

          <ul className="mt-8 grid gap-3 border-t border-white/20 pt-6">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon size={16} className="text-terracotta" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: form */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" aria-label="Roamly home" className="w-fit">
          <Logo />
        </Link>
        <div className="relative mt-6 h-40 overflow-hidden rounded-3xl bg-forest-dark lg:hidden">
  <SmartImage src={authImage} alt="" className="absolute inset-0 h-full w-full" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
  <p className="absolute bottom-4 left-5 font-display text-2xl leading-tight text-white">
    Every great trip
    <br />
    starts with a <em className="italic text-terracotta">plan.</em>
  </p>
</div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <AuthForm
            key={mode}
            mode={mode}
            onModeChange={(m) => setParams(m === 'signup' ? { mode: 'signup' } : {})}
          />
        </div>
      </div>
    </div>
  )
}