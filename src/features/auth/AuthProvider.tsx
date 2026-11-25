import { useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { AuthContext, type AuthContextValue } from './authContext'
import { startSync, stopSync } from '@/features/sync/syncEngine'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0) // naam/photo update ke baad re-render ke liye

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])
  const uid = user?.uid
  useEffect(() => {
    if (!uid) return
    startSync(uid)
    return () => stopSync()
  }, [uid])
  
  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: async () => {
      await signInWithPopup(auth, googleProvider)
    },
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    signUpWithEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      setTick((t) => t + 1)
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth, email)
    },
    updatePhoto: async (url) => {
      if (!auth.currentUser) return
      await updateProfile(auth.currentUser, { photoURL: url })
      setTick((t) => t + 1)
    },
    logout: async () => {
      await signOut(auth)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}