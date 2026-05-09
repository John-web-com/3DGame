import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a2e',
          color: '#fff',
          fontFamily: '-apple-system, sans-serif'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</h1>
          <h2 style={{ marginBottom: '8px' }}>页面出错了</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
