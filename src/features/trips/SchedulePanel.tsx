import { useMemo } from 'react'
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import type { Issue, Severity } from '@/features/trips/scheduleEngine'

const tone: Record<Severity, { box: string; icon: string }> = {
  error: { box: 'border-red-200 bg-red-50', icon: 'text-red-600' },
  warning: { box: 'border-terracotta/30 bg-terracotta/5', icon: 'text-terracotta' },
  info: { box: 'border-sand bg-cream', icon: 'text-forest' },
}

interface SchedulePanelProps {
  issues: Issue[]
  dayIndex: number
  activityCount: number
  dismissedCount: number
  onSelectDay: (day: number) => void
  onApply: (issue: Issue) => void
  onDismiss: (issue: Issue) => void
  onRestore: () => void
}

export default function SchedulePanel({
  issues,
  dayIndex,
  activityCount,
  dismissedCount,
  onSelectDay,
  onApply,
  onDismiss,
  onRestore,
}: SchedulePanelProps) {
  const current = issues.filter((i) => i.day === dayIndex)

  const otherDays = useMemo(() => {
    const counts = new Map<number, number>()
    for (const i of issues) {
      if (i.day !== dayIndex) counts.set(i.day, (counts.get(i.day) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0] - b[0])
  }, [issues, dayIndex])

  return (
    <div className="rounded-3xl border border-sand bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-forest">Schedule check</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            current.length === 0 ? 'bg-sand text-forest' : 'bg-terracotta text-white'
          }`}
        >
          {current.length === 0 ? 'All clear' : `${current.length} to review`}
        </span>
      </div>

      {current.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-cream p-4">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest" />
          <p className="text-sm text-muted">
            {activityCount === 0
              ? `Add places to Day ${dayIndex + 1} to check the schedule.`
              : `Day ${dayIndex + 1}: times, gaps and length look fine.`}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {current.map((issue) => {
            const Icon = issue.severity === 'info' ? Info : TriangleAlert
            return (
              <li
                key={issue.key}
                className={`rounded-2xl border p-4 ${tone[issue.severity].box}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={17} className={`mt-0.5 shrink-0 ${tone[issue.severity].icon}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{issue.message}</p>
                    {issue.detail && (
                      <p className="mt-1 text-xs leading-relaxed text-muted">{issue.detail}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {issue.fix && (
                        <button
                          type="button"
                          onClick={() => onApply(issue)}
                          className="rounded-full bg-forest px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-forest-dark active:scale-95"
                        >
                          {issue.fix.label}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDismiss(issue)}
                        className="text-xs font-medium text-muted underline-offset-2 transition hover:text-ink hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {otherDays.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand pt-4">
          <span className="text-xs text-muted">Also needs a look:</span>
          {otherDays.map(([d, n]) => (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDay(d)}
              className="rounded-full border border-sand px-3 py-1 text-xs font-medium text-forest transition hover:bg-sand"
            >
              Day {d + 1} · {n}
            </button>
          ))}
        </div>
      )}

      {dismissedCount > 0 && (
        <button
          type="button"
          onClick={onRestore}
          className="mt-4 text-xs font-medium text-muted underline-offset-2 transition hover:text-ink hover:underline"
        >
          Show {dismissedCount} dismissed
        </button>
      )}
    </div>
  )
}