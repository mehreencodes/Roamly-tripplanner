import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Readiness } from './readiness'

interface Props {
  readiness: Readiness
  onGoToDay: (day: number) => void
}

export default function TripReadiness({ readiness, onGoToDay }: Props) {
  const { score, status, items } = readiness
  const good = score >= 80

  return (
    <div className="rounded-3xl border border-sand bg-white p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Trip readiness</p>
          <p className="mt-1 font-display text-4xl leading-none tabular-nums text-forest">
            {score}
            <span className="text-base text-muted"> / 100</span>
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            good ? 'bg-forest/10 text-forest' : 'bg-terracotta/10 text-terracotta'
          }`}
        >
          {status}
        </span>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Trip readiness"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            good ? 'bg-forest' : 'bg-terracotta'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <ul className="mt-3 divide-y divide-sand">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-3">
            {item.ok ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-forest" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-terracotta" />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex justify-between gap-2 text-sm font-medium text-forest">
                {item.label}
                <span className="text-xs font-normal tabular-nums text-muted">
                  {item.points}/{item.max}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-muted">{item.note}</p>
              {!item.ok && item.day !== undefined && (
                <button
                  type="button"
                  onClick={() => onGoToDay(item.day as number)}
                  className="mt-1.5 text-xs font-medium text-terracotta underline-offset-4 hover:underline"
                >
                  Go to Day {item.day + 1}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}