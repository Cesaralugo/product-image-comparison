// src/components/Common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'  // Remove React import

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', margin: '20px', border: '2px solid red', borderRadius: '8px' }}>
          <h2 style={{ color: 'red' }}>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Error Details</summary>
            <p><strong>{this.state.error?.toString()}</strong></p>
            <p>{this.state.errorInfo?.componentStack}</p>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
