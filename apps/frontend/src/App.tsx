import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { CoachesPage } from './pages/CoachesPage'
import { SessionsPage } from './pages/SessionsPage'
import { SettingsPage } from './pages/SettingsPage'
import { LiveSessionPage } from './pages/LiveSessionPage'
import SessionStartPage from './pages/SessionStartPage'

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

        {/* Full-screen routes (no bottom nav) */}
        <Route path="/session/:sessionId" element={<LiveSessionPage />} />
        <Route path="/session/start" element={<SessionStartPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
