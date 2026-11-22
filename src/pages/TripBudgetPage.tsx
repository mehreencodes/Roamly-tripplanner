import { useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Receipt, Trash2 } from 'lucide-react'
import BudgetOverview, { BudgetSetupForm } from '@/features/budget/BudgetOverview'
import ExpenseForm from '@/features/budget/ExpenseForm'
import { budgetActions, useBudget, type ExpenseInput } from '@/features/budget/budgetStore'
import { expenseVariance, summarizeBudget } from '@/features/budget/budgetMath'
import { categoryMeta } from '@/features/budget/categoryMeta'
import { useAuth } from '@/features/auth/authContext'
import { getProfile } from '@/features/auth/profileStorage'
import { useTrips } from '@/features/trips/tripStore'
import { addDays, dateRange, findDestination, fmtDay } from '@/features/trips/tripUtils'
import { formatMoney, isCurrencyCode, type CurrencyCode } from '@/lib/money'
import type { Expense } from '@/types/budget'
import { currencyForCountry } from '@/lib/countryCurrency'

interface EditingState {
  expense: Expense
  focus: 'title' | 'actual'
}

export default function TripBudgetPage() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const trips = useTrips()
  const trip = trips.find((t) => t.id === id)
  const budget = useBudget(trip?.id)
  const summary = useMemo(() => (budget ? summarizeBudget(budget) : null), [budget])
  const [editing, setEditing] = useState<EditingState | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <div className="h-40 animate-pulse rounded-3xl bg-sand" />
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />

  if (!trip) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
        <h1 className="font-display text-4xl text-forest">Trip not found</h1>
        <p className="mt-3 text-muted">It may have been deleted, or the link is wrong.</p>
        <Link
          to="/trips"
          className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest-dark"
        >
          Back to my trips
        </Link>
      </section>
    )
  }

  const dest = findDestination(trip.destinationSlug)
  // Pehle destination ke mulk ki currency, phir profile ki pasand, warna PKR
  const savedCurrency = getProfile(user.uid)?.currency
  const defaultCurrency: CurrencyCode =
    currencyForCountry(dest?.country) ??
    (savedCurrency && isCurrencyCode(savedCurrency) ? savedCurrency : 'PKR')

  const dayOptions = trip.days.map((_, i) => ({
    value: i,
    label: `Day ${i + 1} · ${fmtDay(addDays(trip.startDate, i))}`,
  }))

  const saveBudget = ({
    currency,
    totalMinor,
  }: {
    currency: CurrencyCode
    totalMinor: number | null
  }) => {
    if (!budget) {
      budgetActions.create(trip.id, currency, totalMinor)
      return
    }
    if (currency !== budget.currency) budgetActions.setCurrency(trip.id, currency)
    budgetActions.setTotal(trip.id, totalMinor)
  }

  const startEdit = (expense: Expense, focus: 'title' | 'actual') => {
    setEditing({ expense, focus })
    // Chhoti screen par form neeche hota hai, wahan tak scroll karao
    if (window.matchMedia('(max-width: 1023px)').matches) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSubmit = (input: ExpenseInput) => {
    if (editing) {
      budgetActions.updateExpense(trip.id, editing.expense.id, input)
      setEditing(null)
    } else {
      budgetActions.addExpense(trip.id, input)
    }
  }

  const handleDelete = (expense: Expense) => {
    if (!window.confirm(`Delete "${expense.title}"?`)) return
    budgetActions.removeExpense(trip.id, expense.id)
    if (editing?.expense.id === expense.id) setEditing(null)
  }

  const expenses = budget
    ? [...budget.expenses].sort(
        (a, b) => (a.dayIndex ?? -1) - (b.dayIndex ?? -1) || a.createdAt - b.createdAt,
      )
    : []

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 sm:pt-8">
      <Link
        to={`/trips/${trip.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-forest transition hover:text-terracotta"
      >
        <ArrowLeft size={16} /> Back to itinerary
      </Link>

      <header className="mt-5">
        <p className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
          <span className="h-px w-8 bg-terracotta" />
          Budget
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-forest sm:text-5xl">
          {trip.title}
        </h1>
        <p className="mt-2 text-muted">
          {dest ? `${dest.name} · ` : ''}
          {dateRange(trip)} · {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'}
        </p>
      </header>

      {!budget || !summary ? (
        <div className="mt-8 max-w-2xl rounded-3xl border border-sand bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest">Start a budget for this trip</h2>
          <p className="mb-6 mt-2 text-muted">
            Pick a currency and, if you like, a total. Then add expenses as you plan, and record
            what you actually spent along the way.
          </p>
          <BudgetSetupForm
            initialCurrency={defaultCurrency}
            initialTotalMinor={null}
            canChangeCurrency
            submitLabel="Start budget"
            onSubmit={saveBudget}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          <div className="min-w-0 space-y-6">
            <BudgetOverview
              summary={summary}
              currency={budget.currency}
              canChangeCurrency={budget.expenses.length === 0}
              onSaveBudget={saveBudget}
            />

            <div>
              <h2 className="font-display text-2xl text-forest">Expenses</h2>

              {expenses.length === 0 ? (
                <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-sand bg-white/60 px-6 py-14 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-forest">
                    <Receipt size={22} />
                  </span>
                  <p className="mt-4 font-display text-xl text-forest">No expenses yet</p>
                  <p className="mt-1 text-sm text-muted">
                    Add your first one using the form.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {expenses.map((e) => {
                    const { label, Icon } = categoryMeta[e.category]
                    const variance = expenseVariance(e)
                    const when =
                      e.dayIndex === null
                        ? 'Whole trip'
                        : `Day ${e.dayIndex + 1} · ${fmtDay(addDays(trip.startDate, e.dayIndex))}`
                    return (
                      <li key={e.id} className="rounded-2xl border border-sand bg-white p-4">
                        <div className="flex items-start gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-forest">
                            <Icon size={18} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-medium text-forest">{e.title}</h3>
                            <p className="mt-0.5 text-xs text-muted">
                              {label} · {when}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            {e.actualMinor === null ? (
                              <>
                                <p className="font-medium tabular-nums text-ink">
                                  {formatMoney(e.estimatedMinor, budget.currency)}
                                </p>
                                <p className="text-xs text-muted">Estimated</p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium tabular-nums text-ink">
                                  {formatMoney(e.actualMinor, budget.currency)}
                                </p>
                                <p className="text-xs text-muted">
                                  est. {formatMoney(e.estimatedMinor, budget.currency)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 border-t border-sand pt-3">
                          {e.actualMinor === null ? (
                            <button
                              type="button"
                              onClick={() => startEdit(e, 'actual')}
                              className="rounded-full border border-forest/20 px-3.5 py-1.5 text-xs font-medium text-forest transition hover:bg-forest hover:text-white active:scale-95"
                            >
                              Record actual
                            </button>
                          ) : (
                            variance !== null &&
                            variance !== 0 && (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  variance > 0
                                    ? 'bg-terracotta/15 text-terracotta'
                                    : 'bg-forest/10 text-forest'
                                }`}
                              >
                                {variance > 0 ? '+' : '-'}
                                {formatMoney(Math.abs(variance), budget.currency)}{' '}
                                {variance > 0 ? 'over estimate' : 'under estimate'}
                              </span>
                            )
                          )}

                          <div className="ml-auto flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(e, 'title')}
                              aria-label={`Edit ${e.title}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sand hover:text-forest"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(e)}
                              aria-label={`Delete ${e.title}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <aside ref={formRef} className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
            <ExpenseForm
              key={editing?.expense.id ?? 'new'}
              currency={budget.currency}
              dayOptions={dayOptions}
              editing={editing?.expense ?? null}
              autoFocus={editing?.focus}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          </aside>
        </div>
      )}
    </section>
  )
}