import React from 'react'
import { Sprout } from 'lucide-react'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('eduroot error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F6F2] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full flex flex-col items-center">
            <Sprout size={48} className="text-[#0F3D2E] animate-pulse" />
            <h1 className="text-2xl font-bold text-[#111111] mt-6">
              Something went wrong.
            </h1>
            <p className="text-sm text-[#5F6368] mt-2 leading-relaxed">
              An unexpected error occurred. Please refresh the page.
            </p>
            <div className="flex flex-col w-full gap-2 mt-6">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full bg-[#0F3D2E] hover:bg-[#15543f] text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                Refresh page
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/' }}
                className="w-full border border-gray-200 hover:bg-gray-50 text-[#111111] py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
