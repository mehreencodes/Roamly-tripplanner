import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from '@/features/auth/authContext'

interface SavedState {
  byUser: Record<string, string[]> // uid -> saved destination slugs
  toggle: (uid: string, slug: string) => void
}

const useSavedStore = create<SavedState>()(
  persist(
    (set) => ({
      byUser: {},
      toggle: (uid, slug) =>
        set((state) => {
          const current = state.byUser[uid] ?? []
          const next = current.includes(slug)
            ? current.filter((s) => s !== slug)
            : [...current, slug]
          return { byUser: { ...state.byUser, [uid]: next } }
        }),
    }),
    { name: 'roamly:saved' },
  ),
)

export function useSaved() {
  const { user } = useAuth()
  const byUser = useSavedStore((s) => s.byUser)
  const toggleForUser = useSavedStore((s) => s.toggle)
  const saved = user ? (byUser[user.uid] ?? []) : []

  return {
    saved,
    isSaved: (slug: string) => saved.includes(slug),
    toggle: (slug: string) => {
      if (user) toggleForUser(user.uid, slug)
    },
  }
}