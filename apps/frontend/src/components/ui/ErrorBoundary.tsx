import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  handleReload = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Something went wrong
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
