'use client'

import { Component, type ReactNode } from 'react'
import { CakeSlice, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-[#7C1D2E] items-center justify-center mb-4">
              <CakeSlice className="h-9 w-9 text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-[#3D2B1F] mb-2">Algo salió mal</h1>
            <p className="text-[#9C8A82] text-sm mb-6">Ocurrió un error inesperado. Intenta recargar la página.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#7C1D2E] rounded-lg hover:bg-[#5C1420] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
