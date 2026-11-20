import type { CurrencyCode } from '@/lib/money'

export const EXPENSE_CATEGORIES = [
  'accommodation',
  'transport',
  'food',
  'activities',
  'shopping',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  title: string
  category: ExpenseCategory
  /** Andaza, minor units mein (paisay/cents) */
  estimatedMinor: number
  /** Asli kharch. null = abhi kharch nahi hua, 0 = free */
  actualMinor: number | null
  /** Trip ka din (0 se shuru) ya null = poori trip ka kharch */
  dayIndex: number | null
  createdAt: number
}

export interface TripBudget {
  currency: CurrencyCode
  /** Trip ka total budget (minor units). null = abhi set nahi */
  totalMinor: number | null
  expenses: Expense[]
}