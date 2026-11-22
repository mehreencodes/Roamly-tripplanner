import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { RouteErrorBoundary } from '@/components/ErrorBoundary'
import RouteFallback from '@/components/RouteFallback'
import AuthProvider from '@/features/auth/AuthProvider'
import RequireAuth from '@/features/auth/RequireAuth'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'

// Home pehle hi load hota hai (pehli screen mein delay na aaye). Baaqi pages zaroorat par.
const ExplorePage = lazy(() => import('@/pages/ExplorePage'))
const DestinationDetailPage = lazy(() => import('@/pages/DestinationDetailPage'))
const SavedPage = lazy(() => import('@/pages/SavedPage'))
const AuthPage = lazy(() => import('@/pages/AuthPage'))
const WelcomePage = lazy(() => import('@/pages/WelcomePage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const TripsPage = lazy(() => import('@/pages/TripsPage'))
const TripPlannerPage = lazy(() => import('@/pages/TripPlannerPage'))
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage'))
const TripBudgetPage = lazy(() => import('@/pages/TripBudgetPage'))

/** Har page: error aaye to navbar ke saath saaf screen, aur load hote waqt spinner */
const page = (node: ReactNode) => (
  <RouteErrorBoundary>
    <Suspense fallback={<RouteFallback />}>{node}</Suspense>
  </RouteErrorBoundary>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteErrorBoundary>
          <Routes>
            {/* Bina navbar wale pages */}
            <Route path="/auth" element={page(<AuthPage />)} />
            <Route path="/welcome" element={page(<WelcomePage />)} />

            {/* Navbar wale pages */}
            <Route element={<Layout />}>
              <Route path="/" element={page(<HomePage />)} />
              <Route path="/explore" element={page(<ExplorePage />)} />
              <Route path="/destinations/:slug" element={page(<DestinationDetailPage />)} />
              <Route path="/saved" element={page(<SavedPage />)} />
              <Route path="/profile" element={page(<ProfilePage />)} />

              {/* Sirf logged-in users */}
              <Route element={<RequireAuth />}>
                <Route path="/trips" element={page(<TripsPage />)} />
                <Route path="/trips/new" element={page(<TripPlannerPage />)} />
                <Route path="/trips/:id" element={page(<TripDetailPage />)} />
                <Route path="/trips/:id/budget" element={page(<TripBudgetPage />)} />
              </Route>

              {/* Koi route match na ho */}
              <Route path="*" element={page(<NotFoundPage />)} />
            </Route>
          </Routes>
        </RouteErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}