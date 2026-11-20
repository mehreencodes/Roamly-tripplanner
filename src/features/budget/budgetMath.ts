import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type TripBudget } from '@/types/budget'

/** Projected total budget ke is hisse (%) ya us se zyada ho to "tight" */
export const TIGHT_PERCENT = 90

export type BudgetStatus = 'no-budget' | 'on-track' | 'tight' | 'over'

export interface CategorySummary {
  category: ExpenseCategory
  count: number
  /** Jo kharch ho chuka (asli) */
  spentMinor: number
  /** Jin kharchon ka asli abhi nahi likha, unka andaza */
  plannedMinor: number
  /** spent + planned */
  projectedMinor: number
}

export interface BudgetSummary {
  /** null agar budget set nahi (ya 0 se kam/barabar hai) */
  totalMinor: number | null
  spentMinor: number
  plannedMinor: number
  projectedMinor: number
  /** total - projected. Manfi matlab budget se zyada. Budget na ho to null */
  remainingMinor: number | null
  /** Jin kharchon ka asli likha gaya unmein (asli - andaza). Musbat = andaze se zyada kharch */
  varianceMinor: number
  recordedCount: number
  pendingCount: number
  status: BudgetStatus
  byCategory: CategorySummary[]
}

/** Ek kharch ka (asli - andaza). Asli nahi likha to null */
export const expenseVariance = (e: Pick<Expense, 'estimatedMinor' | 'actualMinor'>) =>
  e.actualMinor === null ? null : e.actualMinor - e.estimatedMinor

export function summarizeBudget(
  budget: Pick<TripBudget, 'totalMinor' | 'expenses'>,
): BudgetSummary {
  const rows = Object.fromEntries(
    EXPENSE_CATEGORIES.map((category) => [
      category,
      { category, count: 0, spentMinor: 0, plannedMinor: 0, projectedMinor: 0 },
    ]),
  ) as Record<ExpenseCategory, CategorySummary>

  let spent = 0
  let planned = 0
  let variance = 0
  let recorded = 0

  for (const e of budget.expenses) {
    const row = rows[e.category] ?? rows.other
    row.count++
    if (e.actualMinor === null) {
      planned += e.estimatedMinor
      row.plannedMinor += e.estimatedMinor
    } else {
      spent += e.actualMinor
      row.spentMinor += e.actualMinor
      variance += e.actualMinor - e.estimatedMinor
      recorded++
    }
  }

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...rows[c],
    projectedMinor: rows[c].spentMinor + rows[c].plannedMinor,
  }))

  const projected = spent + planned
  const total = budget.totalMinor !== null && budget.totalMinor > 0 ? budget.totalMinor : null

  let status: BudgetStatus = 'no-budget'
  if (total !== null) {
    if (projected > total) status = 'over'
    else if (projected * 100 >= total * TIGHT_PERCENT) status = 'tight'
    else status = 'on-track'
  }

  return {
    totalMinor: total,
    spentMinor: spent,
    plannedMinor: planned,
    projectedMinor: projected,
    remainingMinor: total === null ? null : total - projected,
    varianceMinor: variance,
    recordedCount: recorded,
    pendingCount: budget.expenses.length - recorded,
    status,
    byCategory,
  }
}