import { Loader2 } from 'lucide-react'

export default function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-6"
    >
      <Loader2 size={26} className="animate-spin text-forest" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  )
}