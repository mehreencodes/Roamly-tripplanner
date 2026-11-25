import { z } from 'zod'

const EXPENSE_CATEGORIES = [
  'accommodation',
  'transport',
  'food',
  'activities',
  'shopping',
  'other',
] as const

const minor = z.number().int().min(0).max(1_000_000_000_000)

const activity = z.object({
  id: z.string().min(1).max(64),
  placeId: z.string().max(80).nullable(),
  title: z.string().trim().min(1).max(60),
  startMin: z.number().int().min(0).max(1440).nullable(),
  durationMin: z.number().int().min(15).max(720),
})

const expense = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(80),
  category: z.enum(EXPENSE_CATEGORIES),
  estimatedMinor: minor,
  actualMinor: minor.nullable(),
  dayIndex: z.number().int().min(0).max(29).nullable(),
  createdAt: z.number(),
})

const budget = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  totalMinor: minor.nullable(),
  expenses: z.array(expense).max(300),
})

export const tripSchema = z.object({
  id: z.uuid(),
  destinationSlug: z.string().min(1).max(60),
  title: z.string().trim().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(z.array(activity).max(50)).min(1).max(30),
  createdAt: z.number(),
  dismissedIssues: z.array(z.string().max(200)).max(200).optional(),
  budget: budget.optional(),
})

export type TripInput = z.infer<typeof tripSchema>