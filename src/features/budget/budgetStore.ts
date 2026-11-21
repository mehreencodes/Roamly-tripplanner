import { useSyncExternalStore } from 'react'
import type { CurrencyCode } from '@/lib/money'
import type { Expense, TripBudget } from '@/types/budget'

const KEY = 'roamly:budgets:v1'

type BudgetMap = Record<string, TripBudget>
export type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>

function read(): BudgetMap {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as BudgetMap) : {}
  } catch {
    return {}
  }
}

let budgets: BudgetMap = read()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function commit(next: BudgetMap) {
  budgets = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full ya blocked: memory mein chalta rahe */
  }
  notify()
}

// Doosre tab mein badlav ho to yahan bhi nazar aaye
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    budgets = read()
    notify()
  }
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => budgets

/** Trip ka budget. Abhi set nahi hua to null */
export function useBudget(tripId: string | undefined): TripBudget | null {
  const all = useSyncExternalStore(subscribe, getSnapshot)
  return tripId ? (all[tripId] ?? null) : null
}

function update(tripId: string, fn: (b: TripBudget) => TripBudget) {
  const current = budgets[tripId]
  if (!current) return
  commit({ ...budgets, [tripId]: fn(current) })
}

const cleanAmount = (n: number) => (Number.isSafeInteger(n) && n > 0 ? n : 0)

const clean = (input: ExpenseInput): ExpenseInput => ({
  ...input,
  title: input.title.trim().slice(0, 60),
  estimatedMinor: cleanAmount(input.estimatedMinor),
  actualMinor: input.actualMinor === null ? null : cleanAmount(input.actualMinor),
})

export const budgetActions = {
  create(tripId: string, currency: CurrencyCode, totalMinor: number | null) {
    if (budgets[tripId]) return
    commit({ ...budgets, [tripId]: { currency, totalMinor, expenses: [] } })
  },

  setTotal(tripId: string, totalMinor: number | null) {
    update(tripId, (b) => ({ ...b, totalMinor }))
  },

  /** Currency tab hi badalti hai jab koi kharch na ho (warna paisay ka matlab badal jayega) */
  setCurrency(tripId: string, currency: CurrencyCode) {
    update(tripId, (b) => (b.expenses.length === 0 ? { ...b, currency } : b))
  },

  addExpense(tripId: string, input: ExpenseInput) {
    update(tripId, (b) => ({
      ...b,
      expenses: [...b.expenses, { ...clean(input), id: crypto.randomUUID(), createdAt: Date.now() }],
    }))
  },

  updateExpense(tripId: string, expenseId: string, input: ExpenseInput) {
    update(tripId, (b) => ({
      ...b,
      expenses: b.expenses.map((e) => (e.id === expenseId ? { ...e, ...clean(input) } : e)),
    }))
  },

  removeExpense(tripId: string, expenseId: string) {
    update(tripId, (b) => ({ ...b, expenses: b.expenses.filter((e) => e.id !== expenseId) }))
  },
}