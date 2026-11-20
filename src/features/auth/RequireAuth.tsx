import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './authContext'

export default function RequireAuth() {
  const { user, loading } = useAuth()

  // Refresh par auth check hone tak wait, warna logged-in user bhi pal bhar ke liye /auth par chala jata hai
  if (loading) return <div className="min-h-[60vh]" />

  if (!user) return <Navigate to="/auth" replace />

  return <Outlet />
}