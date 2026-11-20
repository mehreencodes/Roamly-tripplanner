import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from '@/features/auth/AuthProvider'
import RequireAuth from '@/features/auth/RequireAuth'
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import ExplorePage from '@/pages/ExplorePage'
import DestinationDetailPage from '@/pages/DestinationDetailPage'
import SavedPage from '@/pages/SavedPage'
import AuthPage from '@/pages/AuthPage'
import WelcomePage from '@/pages/WelcomePage'
import ProfilePage from '@/pages/ProfilePage'
import TripsPage from '@/pages/TripsPage'
import TripPlannerPage from '@/pages/TripPlannerPage'
import TripDetailPage from '@/pages/TripDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Bina navbar wale pages */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/welcome" element={<WelcomePage />} />

          {/* Navbar wale pages */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Sirf logged-in users */}
            <Route element={<RequireAuth />}>
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/trips/new" element={<TripPlannerPage />} />
              <Route path="/trips/:id" element={<TripDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}