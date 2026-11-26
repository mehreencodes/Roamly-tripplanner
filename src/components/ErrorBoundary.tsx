import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, TriangleAlert } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Yeh badle to error saaf ho jata hai  */
  resetKey?: string
}

interface State {
  error: Error | null
}

const isStaleChunk = (error: Error) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
    error.message,
  )

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Roamly error boundary:', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const stale = isStaleChunk(error)

    return (
      <section
        role="alert"
        className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
          <TriangleAlert size={26} />
        </span>
        <h1 className="mt-5 font-display text-3xl text-forest">
          {stale ? 'A new version is available' : 'Something went wrong'}
        </h1>
        <p className="mt-3 text-muted">
          {stale
            ? 'Roamly was just updated. Reload the page to continue.'
            : 'This page hit an unexpected problem. Your trips are safe. Reloading usually fixes it.'}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
          >
            <RefreshCw size={16} /> Reload page
          </button>
          <a
            href="/"
            className="rounded-full border border-forest/20 px-6 py-3 text-sm font-medium text-forest transition hover:bg-sand active:scale-95"
          >
            Back to home
          </a>
        </div>

        <details className="mt-8 text-left text-xs text-muted">
          <summary className="cursor-pointer text-center">Technical details</summary>
          <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap rounded-xl bg-sand/70 p-3">
            {error.message}
          </pre>
        </details>
      </section>
    )
  }
}

/** Route badalne par error khud saaf ho jata hai */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
}