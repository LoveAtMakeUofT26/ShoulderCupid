import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { CoachesPage } from './pages/CoachesPage'
import { SessionsPage } from './pages/SessionsPage'
import { SettingsPage } from './pages/SettingsPage'
import { LiveSessionPage } from './pages/LiveSessionPage'
import { SessionReportPage } from './pages/SessionReportPage'
import { OnboardingPage } from './pages/OnboardingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />

        {/* App routes (with bottom nav) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/coaches" element={<CoachesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Onboarding (full-screen, no nav) */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Full-screen routes (no bottom nav) */}
        <Route path="/sessions/:id" element={<SessionReportPage />} />
        <Route path="/session/:sessionId" element={<LiveSessionPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
