import { useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CalendarDays, Camera, Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/authContext'
import { getProfile } from '@/features/auth/profileStorage'
import { uploadImage } from '@/lib/cloudinary'

const companionLabels: Record<string, string> = {
  solo: 'Solo',
  partner: 'With a partner',
  friends: 'With friends',
  family: 'With family',
}

export default function ProfilePage() {
  const { user, loading, logout, updatePhoto } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // same photo dobara chunne par bhi chale
    if (!file) return
    setPhotoError('')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      await updatePhoto(url)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not update your photo.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setPhotoError('')
    setUploading(true)
    try {
      await updatePhoto(null)
    } catch {
      setPhotoError('Could not remove your photo.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="min-h-[60vh]" />
  if (!user) return <Navigate to="/auth" replace />

  const name = user.displayName || user.email?.split('@')[0] || 'Traveler'
  const prefs = getProfile(user.uid)
  const hasPrefs = !!prefs && !prefs.skipped

  const method =
    user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email and password'

  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently'

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-terracotta text-4xl font-semibold text-white ring-4 ring-sand"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
            <span
              className={`absolute inset-0 flex items-center justify-center bg-black/50 transition ${
                uploading
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
              }`}
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
            </span>
          </button>
          <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white ring-2 ring-cream">
            <Camera size={15} />
          </span>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          className="hidden"
        />

        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl text-forest sm:text-4xl">{name}</h1>
          <p className="truncate text-muted">{user.email}</p>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="font-medium text-terracotta hover:underline"
            >
              {user.photoURL ? 'Change photo' : 'Add photo'}
            </button>
            {user.photoURL && (
              <>
                <span className="text-sand">|</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="text-muted hover:text-ink hover:underline"
                >
                  Remove
                </button>
              </>
            )}
          </div>
          {photoError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {photoError}
            </p>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="mt-10 divide-y divide-sand rounded-3xl border border-sand bg-white">
        <div className="flex items-center gap-4 p-5">
          <ShieldCheck size={20} className="text-forest" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Signed in with</p>
            <p className="font-medium text-ink">{method}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5">
          <CalendarDays size={20} className="text-forest" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Member since</p>
            <p className="font-medium text-ink">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="mt-6 rounded-3xl border border-sand bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-forest">Travel preferences</h2>
          <Link to="/welcome" className="text-sm font-medium text-terracotta hover:underline">
            {hasPrefs ? 'Update' : 'Set up'}
          </Link>
        </div>

        {hasPrefs && prefs ? (
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Loves</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {prefs.styles.length > 0 ? (
                  prefs.styles.map((s) => (
                    <span key={s} className="rounded-full bg-sand px-3 py-1 text-forest">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">Not chosen</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Usually travels</dt>
              <dd className="mt-1 text-ink">{companionLabels[prefs.companions] ?? 'Not chosen'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Currency</dt>
              <dd className="mt-1 text-ink">{prefs.currency}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted">
            You haven't set any preferences yet. Tell Roamly what you love and we'll tailor your
            suggestions.
          </p>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 flex items-center gap-2 rounded-full border border-forest/20 px-6 py-3 text-sm font-medium text-forest transition hover:bg-sand active:scale-95"
      >
        <LogOut size={17} /> Sign out
      </button>
    </section>
  )
}