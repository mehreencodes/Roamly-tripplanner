export default function ConfigError({ missing }: { missing: string[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-sand bg-white p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-terracotta">Setup incomplete</p>
        <h1 className="mt-3 font-display text-3xl text-forest">Firebase is not configured</h1>
        <p className="mt-3 text-sm text-muted">
          The app can't start because these environment variables are missing:
        </p>

        <ul className="mt-4 space-y-1.5">
          {missing.map((name) => (
            <li key={name}>
              <code className="rounded-md bg-sand px-2 py-1 text-xs text-forest">{name}</code>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3 border-t border-sand pt-5 text-sm text-muted">
          <p>
            <span className="font-medium text-forest">Local:</span> add them to{' '}
            <code className="text-xs">.env.local</code>, then restart{' '}
            <code className="text-xs">npm run dev</code>.
          </p>
          <p>
            <span className="font-medium text-forest">Vercel:</span> add them under Settings,
            Environment Variables, then redeploy.
          </p>
        </div>
      </div>
    </main>
  )
}