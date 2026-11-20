import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from './authContext'

export type AuthMode = 'login' | 'signup'

const makeSchema = (mode: AuthMode) =>
  z.object({
    name:
      mode === 'signup'
        ? z.string().trim().min(2, 'Please enter your name')
        : z.string().optional(),
    email: z.string().trim().email('Enter a valid email address'),
    password:
      mode === 'signup'
        ? z.string().min(8, 'Use at least 8 characters')
        : z.string().min(1, 'Enter your password'),
  })

type FormValues = z.infer<ReturnType<typeof makeSchema>>

const errorMessages: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network problem. Check your connection and try again.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
}

function readError(err: unknown) {
  const code = (err as { code?: string })?.code ?? ''
  return code in errorMessages ? errorMessages[code] : 'Something went wrong. Please try again.'
}

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition focus:ring-2 ${
    invalid
      ? 'border-red-400 focus:ring-red-200'
      : 'border-sand focus:border-terracotta focus:ring-terracotta/20'
  }`

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

interface AuthFormProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
}

export default function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const isSignup = mode === 'signup'

  const [showPassword, setShowPassword] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [info, setInfo] = useState('')

  const schema = useMemo(() => makeSchema(mode), [mode])
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError('')
    setInfo('')
    try {
      if (isSignup) await signUpWithEmail(values.name ?? '', values.email, values.password)
      else await signInWithEmail(values.email, values.password)
    } catch (e) {
      setFormError(readError(e))
    }
  }

  const onGoogle = async () => {
    setFormError('')
    setInfo('')
    setGoogleBusy(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setFormError(readError(e))
    } finally {
      setGoogleBusy(false)
    }
  }

  const onForgot = async () => {
    setFormError('')
    setInfo('')
    const email = (getValues('email') ?? '').trim()
    if (!email) {
      setFormError('Type your email above first, then click "Forgot password?".')
      return
    }
    try {
      await resetPassword(email)
      setInfo('If an account exists for this email, a reset link has been sent.')
    } catch (e) {
      setFormError(readError(e))
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-forest">
        {isSignup ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-2 text-muted">
        {isSignup
          ? 'Start planning trips with your friends in minutes.'
          : 'Sign in to continue planning your trips.'}
      </p>

      <button
        type="button"
        onClick={onGoogle}
        disabled={googleBusy || isSubmitting}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-sand bg-white py-3 font-medium text-ink transition hover:bg-sand/60 active:scale-[0.98] disabled:opacity-60"
      >
        {googleBusy ? <Loader2 className="animate-spin" size={20} /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-sand" />
        or
        <span className="h-px flex-1 bg-sand" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {isSignup && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              className={inputClass(!!errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={inputClass(!!errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            {!isSignup && (
              <button
                type="button"
                onClick={onForgot}
                className="text-sm text-terracotta hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              aria-invalid={!!errors.password}
              className={`${inputClass(!!errors.password)} pr-12`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {formError && (
          <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}
        {info && (
          <div role="status" className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || googleBusy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-terracotta py-3.5 font-medium text-white transition hover:bg-terracotta/90 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="animate-spin" size={18} />}
          {isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {isSignup ? 'Already have an account?' : 'New to Roamly?'}{' '}
        <button
          type="button"
          onClick={() => onModeChange(isSignup ? 'login' : 'signup')}
          className="font-medium text-forest hover:text-terracotta hover:underline"
        >
          {isSignup ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}