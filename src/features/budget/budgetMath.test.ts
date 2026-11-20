import { describe, expect, it } from 'vitest'
import type { Expense, ExpenseCategory } from '@/types/budget'
import { expenseVariance, summarizeBudget } from './budgetMath'

let counter = 0
const exp = (
  category: ExpenseCategory,
  estimatedMinor: number,
  actualMinor: number | null = null,
): Expense => ({
  id: `e${++counter}`,
  title: `Item ${counter}`,
  category,
  estimatedMinor,
  actualMinor,
  dayIndex: null,
  createdAt: 0,
})

describe('summarizeBudget', () => {
  it('handles an empty budget', () => {
    const s = summarizeBudget({ totalMinor: null, expenses: [] })
    expect(s.status).toBe('no-budget')
    expect(s.projectedMinor).toBe(0)
    expect(s.remainingMinor).toBeNull()
    expect(s.byCategory).toHaveLength(6)
  })

  it('separates spent from still-planned and projects the total', () => {
    const s = summarizeBudget({
      totalMinor: 20000,
      expenses: [exp('food', 10000, 12000), exp('transport', 5000)],
    })
    expect(s.spentMinor).toBe(12000)
    expect(s.plannedMinor).toBe(5000)
    expect(s.projectedMinor).toBe(17000)
    expect(s.remainingMinor).toBe(3000)
    expect(s.varianceMinor).toBe(2000)
    expect(s.recordedCount).toBe(1)
    expect(s.pendingCount).toBe(1)
    expect(s.status).toBe('on-track')
  })

  it('turns tight at 90% of the budget', () => {
    const expenses = [exp('food', 10000, 12000), exp('transport', 5000)]
    expect(summarizeBudget({ totalMinor: 18000, expenses }).status).toBe('tight')
  })

  it('is tight, not over, when exactly on budget', () => {
    const s = summarizeBudget({
      totalMinor: 17000,
      expenses: [exp('food', 10000, 12000), exp('transport', 5000)],
    })
    expect(s.remainingMinor).toBe(0)
    expect(s.status).toBe('tight')
  })

  it('reports over budget with a negative remainder', () => {
    const s = summarizeBudget({
      totalMinor: 15000,
      expenses: [exp('food', 10000, 12000), exp('transport', 5000)],
    })
    expect(s.remainingMinor).toBe(-2000)
    expect(s.status).toBe('over')
  })

  it('treats an actual of 0 as recorded (a free item), not pending', () => {
    const s = summarizeBudget({ totalMinor: 10000, expenses: [exp('food', 5000, 0)] })
    expect(s.spentMinor).toBe(0)
    expect(s.plannedMinor).toBe(0)
    expect(s.projectedMinor).toBe(0)
    expect(s.recordedCount).toBe(1)
    expect(s.varianceMinor).toBe(-5000)
  })

  it('groups by category in a fixed order', () => {
    const s = summarizeBudget({
      totalMinor: null,
      expenses: [exp('food', 1000, 1500), exp('food', 2000), exp('shopping', 700)],
    })
    expect(s.byCategory.map((c) => c.category)).toEqual([
      'accommodation',
      'transport',
      'food',
      'activities',
      'shopping',
      'other',
    ])
    const food = s.byCategory.find((c) => c.category === 'food')
    expect(food).toMatchObject({ count: 2, spentMinor: 1500, plannedMinor: 2000, projectedMinor: 3500 })
  })

  it('ignores a budget total of 0 or less', () => {
    const s = summarizeBudget({ totalMinor: 0, expenses: [exp('food', 100)] })
    expect(s.totalMinor).toBeNull()
    expect(s.status).toBe('no-budget')
    expect(s.remainingMinor).toBeNull()
  })
})

describe('expenseVariance', () => {
  it('is null until the actual is recorded, then actual minus estimate', () => {
    expect(expenseVariance({ estimatedMinor: 500, actualMinor: null })).toBeNull()
    expect(expenseVariance({ estimatedMinor: 500, actualMinor: 650 })).toBe(150)
    expect(expenseVariance({ estimatedMinor: 500, actualMinor: 400 })).toBe(-100)
  })
})