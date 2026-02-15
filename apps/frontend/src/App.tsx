import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SolanaProvider } from './providers/SolanaProvider'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { CoachesPage } from './pages/CoachesPage'
import { CoachDiscoveryPage } from './pages/CoachDiscoveryPage'
import { SessionsPage } from './pages/SessionsPage'
import { SettingsPage } from './pages/SettingsPage'
import { LiveSessionPage } from './pages/LiveSessionPage'
import { SessionReportPage } from './pages/SessionReportPage'
import { OnboardingPage } from './pages/OnboardingPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>An unexpected error occurred.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
    <SolanaProvider>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* App routes (with bottom nav) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/coaches" element={<CoachesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Full-screen coach discovery (no bottom nav) */}
        <Route path="/coaches/discover" element={<CoachDiscoveryPage />} />

        {/* Onboarding (full-screen, no nav) */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Full-screen routes (no bottom nav) */}
        <Route path="/sessions/:id" element={<SessionReportPage />} />
        <Route path="/session/:sessionId" element={<LiveSessionPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </SolanaProvider>
    </ErrorBoundary>
  )
}

export default App
