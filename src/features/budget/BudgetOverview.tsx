import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import {
  CURRENCIES,
  CURRENCY_CODES,
  formatInput,
  formatMoney,
  parseAmount,
  type CurrencyCode,
} from '@/lib/money'
import type { BudgetStatus, BudgetSummary } from './budgetMath'
import { categoryMeta } from './categoryMeta'

/* ------------------------- Budget set/edit karne ka form ------------------------- */
interface BudgetSetupFormProps {
  initialCurrency: CurrencyCode
  initialTotalMinor: number | null
  canChangeCurrency: boolean
  submitLabel: string
  onSubmit: (v: { currency: CurrencyCode; totalMinor: number | null }) => void
  onCancel?: () => void
}

export function BudgetSetupForm({
  initialCurrency,
  initialTotalMinor,
  canChangeCurrency,
  submitLabel,
  onSubmit,
  onCancel,
}: BudgetSetupFormProps) {
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency)
  const [text, setText] = useState(
    initialTotalMinor === null ? '' : formatInput(initialTotalMinor, initialCurrency),
  )
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (value === '') {
      onSubmit({ currency, totalMinor: null })
      return
    }
    const minor = parseAmount(value, currency)
    if (minor === null || minor <= 0) {
      setError(
        CURRENCIES[currency].digits === 0
          ? 'Enter a whole amount greater than 0.'
          : 'Enter an amount greater than 0 (up to 2 decimals).',
      )
      return
    }
    onSubmit({ currency, totalMinor: minor })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <label htmlFor="budget-currency" className="mb-1.5 block text-sm font-medium text-ink">
            Currency
          </label>
          <select
            id="budget-currency"
            value={currency}
            disabled={!canChangeCurrency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-ink outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 disabled:opacity-60"
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {code} · {CURRENCIES[code].name}
              </option>
            ))}
          </select>
          {!canChangeCurrency && (
            <p className="mt-1.5 text-xs text-muted">
              Locked because this trip already has expenses.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="budget-total" className="mb-1.5 block text-sm font-medium text-ink">
            Total budget (optional)
          </label>
          <input
            id="budget-total"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError('')
            }}
            aria-invalid={!!error}
            placeholder="e.g. 150000"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition focus:ring-2 ${
              error
                ? 'border-red-400 focus:ring-red-200'
                : 'border-sand focus:border-terracotta focus:ring-terracotta/20'
            }`}
          />
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition hover:bg-terracotta/90 active:scale-95"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest transition hover:bg-sand active:scale-95"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

/* ---------------------------------- Overview ---------------------------------- */

const statusMeta: Record<Exclude<BudgetStatus, 'no-budget'>, { label: string; pill: string }> = {
  'on-track': { label: 'On track', pill: 'bg-forest/10 text-forest' },
  tight: { label: 'Close to the limit', pill: 'bg-terracotta/15 text-terracotta' },
  over: { label: 'Over budget', pill: 'bg-red-100 text-red-700' },
}

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, (part / whole) * 100) : 0

function Stat({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd
        className={`min-w-0 break-words text-right font-display text-xl sm:mt-1 sm:text-left sm:text-2xl ${
          bad ? 'text-red-600' : 'text-forest'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

interface BudgetOverviewProps {
  summary: BudgetSummary
  currency: CurrencyCode
  canChangeCurrency: boolean
  onSaveBudget: (v: { currency: CurrencyCode; totalMinor: number | null }) => void
}

export default function BudgetOverview({
  summary,
  currency,
  canChangeCurrency,
  onSaveBudget,
}: BudgetOverviewProps) {
  const [editing, setEditing] = useState(false)
  const total = summary.totalMinor
  const over = summary.status === 'over'
  const spentW = total ? pct(summary.spentMinor, total) : 0
  const plannedW = total ? Math.min(100 - spentW, pct(summary.plannedMinor, total)) : 0
  const remaining = summary.remainingMinor
  const status = summary.status === 'no-budget' ? null : statusMeta[summary.status]

  const rows = summary.byCategory
    .filter((c) => c.count > 0)
    .sort((a, b) => b.projectedMinor - a.projectedMinor)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-sand bg-white p-6">
        {editing ? (
          <BudgetSetupForm
            initialCurrency={currency}
            initialTotalMinor={total}
            canChangeCurrency={canChangeCurrency}
            submitLabel="Save budget"
            onCancel={() => setEditing(false)}
            onSubmit={(v) => {
              onSaveBudget(v)
              setEditing(false)
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-muted">Trip budget</p>
                <p className="mt-1 break-words font-display text-3xl text-forest sm:text-4xl">
                  {total === null ? 'Not set' : formatMoney(total, currency)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status && (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.pill}`}>
                    {status.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Edit budget"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-sand text-muted transition hover:bg-sand hover:text-forest"
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>

            {total !== null ? (
              <>
                <div
                  role="img"
                  aria-label="Budget used"
                  className="mt-5 flex h-3 overflow-hidden rounded-full bg-sand"
                >
                  <div className={over ? 'bg-terracotta' : 'bg-forest'} style={{ width: `${spentW}%` }} />
                  <div
                    className={over ? 'bg-terracotta/40' : 'bg-forest/30'}
                    style={{ width: `${plannedW}%` }}
                  />
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${over ? 'bg-terracotta' : 'bg-forest'}`} />
                    Spent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${over ? 'bg-terracotta/40' : 'bg-forest/30'}`}
                    />
                    Still planned
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Set a total to see how much is left. You can still track expenses without one.
              </p>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-sand pt-5 sm:grid-cols-3">
              <Stat label="Spent so far" value={formatMoney(summary.spentMinor, currency)} />
              <Stat label="Still planned" value={formatMoney(summary.plannedMinor, currency)} />
              <Stat
                label={over ? 'Over by' : 'Remaining'}
                value={remaining === null ? '-' : formatMoney(Math.abs(remaining), currency)}
                bad={over}
              />
            </dl>

            {summary.recordedCount > 0 && (
              <p className="mt-5 text-sm text-muted">
                {summary.varianceMinor === 0
                  ? 'Recorded items matched their estimates exactly.'
                  : `Recorded items came in ${formatMoney(Math.abs(summary.varianceMinor), currency)} ${
                      summary.varianceMinor > 0 ? 'over' : 'under'
                    } their estimates.`}
              </p>
            )}
          </>
        )}
      </div>

      <div className="rounded-3xl border border-sand bg-white p-6">
        <h2 className="font-display text-xl text-forest">Where the money goes</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Add your first expense to see the breakdown.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {rows.map((c) => {
              const { label, Icon } = categoryMeta[c.category]
              const share = pct(c.projectedMinor, summary.projectedMinor)
              return (
                <li key={c.category}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-forest">
                      <Icon size={16} className="shrink-0 text-terracotta" /> {label}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink">
                      {formatMoney(c.projectedMinor, currency)}
                      <span className="ml-2 text-xs text-muted">{Math.round(share)}%</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-forest" style={{ width: `${share}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}