import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { minToTime, timeToMin } from '@/features/trips/tripUtils'
import { formatDuration } from '@/lib/format'

const DURATIONS = [30, 60, 90, 120, 180, 240, 360]

interface Props {
  /** Is din ke liye agla khali time, khud suggest hota hai */
  suggestedStart: number | null
  onAdd: (input: { title: string; startMin: number | null; durationMin: number }) => void
}

const field =
  'h-11 rounded-xl border border-sand bg-white px-3 text-sm text-ink outline-none transition focus:border-terracotta focus:ring-4 focus:ring-terracotta/10'

export default function CustomActivityForm({ suggestedStart, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)

  const openForm = () => {
    setTime(suggestedStart === null ? '' : minToTime(suggestedStart))
    setOpen(true)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title, startMin: timeToMin(time), durationMin: duration })
    setTitle('')
    setDuration(60)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openForm}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-sand py-3.5 text-sm font-medium text-forest transition hover:border-forest/40 hover:bg-white active:scale-[0.99]"
      >
        <Plus size={16} /> Add your own activity
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-2xl border border-sand bg-white p-4"
    >
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted">Activity</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="Hotel check-in, lunch, drive to Karimabad"
          className={`${field} mt-2 w-full placeholder:text-muted`}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted">Start</span>
          <input
            type="time"
            step={900}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`${field} mt-2 w-full tabular-nums`}
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted">Duration</span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={`${field} mt-2 w-full`}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {formatDuration(d)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-forest transition hover:bg-sand"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white transition hover:bg-forest-dark active:scale-95 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </form>
  )
}