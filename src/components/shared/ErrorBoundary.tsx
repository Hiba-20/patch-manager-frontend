import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex h-full items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-exia-red/20 bg-exia-red/[0.06]">
              <AlertTriangle size={24} className="text-exia-red" />
            </div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="text-sm text-exia-text-muted">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-4 py-2 text-sm font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10"
            >
              <RefreshCw size={14} />
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
