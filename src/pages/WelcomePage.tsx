import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import { useAuth } from '@/features/auth/authContext'
import { saveProfile } from '@/features/auth/profileStorage'

const styles = ['Mountains', 'Beaches', 'History', 'Adventure', 'Nature', 'Culture', 'Cities', 'Food']

const companions = [
  { value: 'solo', label: 'Solo', hint: 'Just me' },
  { value: 'partner', label: 'Partner', hint: 'Two of us' },
  { value: 'friends', label: 'Friends', hint: 'A small group' },
  { value: 'family', label: 'Family', hint: 'All ages' },
]

const currencies = ['PKR', 'USD', 'EUR']

export default function WelcomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [picked, setPicked] = useState<string[]>([])
  const [who, setWho] = useState('')
  const [currency, setCurrency] = useState('PKR')

  if (loading) return <div className="min-h-screen bg-cream" />
  if (!user) return <Navigate to="/auth" replace />

  const firstName = (user.displayName || user.email?.split('@')[0] || 'traveler').split(' ')[0]

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))

  const finish = (skip: boolean) => {
    saveProfile(user.uid, {
      styles: skip ? [] : picked,
      companions: skip ? '' : who,
      currency,
      skipped: skip,
    })
    navigate('/explore', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-8">
      <Logo />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto max-w-2xl py-10 sm:py-14"
      >
        <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
          <span className="h-px w-8 bg-terracotta" />
          Welcome
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-forest sm:text-5xl">
          Nice to meet you, {firstName}.
        </h1>
        <p className="mt-3 text-lg text-muted">
          Three quick questions so Roamly can show places you will love. You can change
          these any time.
        </p>

        {/* 1. Styles */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-forest">What do you love?</h2>
          <p className="mt-1 text-sm text-muted">Pick as many as you like.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {styles.map((s) => {
              const on = picked.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
                    on
                      ? 'border-forest bg-forest text-white'
                      : 'border-sand bg-white text-ink hover:border-forest/40'
                  }`}
                >
                  {on && <Check size={15} />}
                  {s}
                </button>
              )
            })}
          </div>
        </section>

        {/* 2. Companions */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-forest">Who do you usually travel with?</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {companions.map((c) => {
              const on = who === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWho(on ? '' : c.value)}
                  className={`rounded-2xl border p-4 text-left transition active:scale-95 ${
                    on
                      ? 'border-terracotta bg-terracotta/10'
                      : 'border-sand bg-white hover:border-forest/40'
                  }`}
                >
                  <p className="font-medium text-ink">{c.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{c.hint}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* 3. Currency */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-forest">Preferred currency</h2>
          <div className="mt-4 inline-flex rounded-full bg-sand p-1" role="group" aria-label="Currency">
            {currencies.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={currency === c}
                onClick={() => setCurrency(c)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  currency === c ? 'bg-forest text-white shadow' : 'text-ink/70 hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => finish(true)}
            className="px-4 py-3 text-sm font-medium text-muted transition hover:text-ink"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => finish(false)}
            className="rounded-full bg-terracotta px-8 py-3.5 font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
          >
            Continue to Roamly
          </button>
        </div>
      </motion.main>
    </div>
  )
}