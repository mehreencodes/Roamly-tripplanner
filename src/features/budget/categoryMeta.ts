import {
  BedDouble,
  Bus,
  ShoppingBag,
  Ticket,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ExpenseCategory } from '@/types/budget'

export const categoryMeta: Record<ExpenseCategory, { label: string; Icon: LucideIcon }> = {
  accommodation: { label: 'Stay', Icon: BedDouble },
  transport: { label: 'Transport', Icon: Bus },
  food: { label: 'Food', Icon: UtensilsCrossed },
  activities: { label: 'Activities', Icon: Ticket },
  shopping: { label: 'Shopping', Icon: ShoppingBag },
  other: { label: 'Other', Icon: Wallet },
}