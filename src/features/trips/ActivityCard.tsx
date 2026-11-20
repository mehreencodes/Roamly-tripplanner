import { ArrowDown, ArrowUp, Clock, Minus, Plus, X } from 'lucide-react'
import {
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  STEP_MIN,
  durationStep,
  endMin,
  formatTime,
  minToTime,
  timeToMin,
} from '@/features/trips/tripUtils'
import { formatDuration } from '@/lib/format'
import type { Attraction } from '@/types/destination'
import type { Activity } from '@/types/trip'

interface ActivityCardProps {
  activity: Activity
  place?: Attraction
  index: number
  isFirst: boolean
  isLast: boolean
  onTimeChange: (startMin: number | null) => void
  onDurationChange: (durationMin: number) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onRename: (title: string) => void
  selected?: boolean
  onSelect?: () => void
}

const iconBtn =
  'flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sand hover:text-forest disabled:opacity-25 disabled:hover:bg-transparent'

export default function ActivityCard({
  activity,
  place,
  index,
  isFirst,
  isLast,
  onTimeChange,
  onDurationChange,
  onMove,
  onRemove,
  onRename,
  selected,
  onSelect,
}: ActivityCardProps) {
  const end = endMin(activity)
  const inputId = `start-${activity.id}`

  return (
    <li
      onClick={onSelect}
      className={`rounded-2xl border bg-white p-4 transition ${
        selected ? 'border-terracotta ring-2 ring-terracotta/30' : 'border-sand'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand font-display text-sm tabular-nums text-forest">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          {activity.placeId === null ? (
            <div className="flex items-center gap-2">
              <input
                key={activity.title}
                defaultValue={activity.title}
                maxLength={60}
                aria-label="Activity name"
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== activity.title) onRename(v)
                  else e.target.value = activity.title
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                className="-mx-1 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 font-medium text-forest outline-none transition hover:border-sand focus:border-terracotta"
              />
              <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 text-xs text-forest">
                Custom
              </span>
            </div>
          ) : (
            <h3 className="font-medium text-forest">{activity.title}</h3>
          )}

          {place && (
            <>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">{place.description}</p>
              <span className="mt-2 inline-block rounded-full bg-sand px-2.5 py-0.5 text-xs capitalize text-forest">
                {place.kind}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            aria-label={`Move ${activity.title} up`}
            className={iconBtn}
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            aria-label={`Move ${activity.title} down`}
            className={iconBtn}
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${activity.title}`}
            className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-sand pt-4">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-muted" />
          <label htmlFor={inputId} className="sr-only">
            Start time for {activity.title}
          </label>
          <input
            id={inputId}
            type="time"
            step={STEP_MIN * 60}
            value={activity.startMin === null ? '' : minToTime(activity.startMin)}
            onChange={(e) => onTimeChange(timeToMin(e.target.value))}
            className="rounded-lg border border-sand bg-cream px-2.5 py-1.5 text-sm tabular-nums text-ink outline-none transition focus:border-terracotta"
          />
          <span className="text-sm tabular-nums text-muted">
            {end === null ? 'No time set' : `to ${formatTime(end)}`}
          </span>
        </div>

        <div
          role="group"
          aria-label={`Duration of ${activity.title}`}
          className="ml-auto flex items-center rounded-xl border border-sand"
        >
          <button
            type="button"
            onClick={() =>
              onDurationChange(activity.durationMin - durationStep(activity.durationMin, -1))
            }
            disabled={activity.durationMin <= MIN_DURATION_MIN}
            aria-label="Shorten"
            className={iconBtn}
          >
            <Minus size={15} />
          </button>
          <span className="min-w-[4.5rem] px-1 text-center text-sm tabular-nums text-forest">
            {formatDuration(activity.durationMin)}
          </span>
          <button
            type="button"
            onClick={() =>
              onDurationChange(activity.durationMin + durationStep(activity.durationMin, 1))
            }
            disabled={activity.durationMin >= MAX_DURATION_MIN}
            aria-label="Lengthen"
            className={iconBtn}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </li>
  )
}