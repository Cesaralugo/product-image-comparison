// src/App.tsx
import React, { useEffect } from 'react'
import { useAppStore } from './state/store'
import MainLayout from './components/Layout/MainLayout'
import ErrorBoundary from './components/Common/ErrorBoundary'
import './App.css'

const App: React.FC = () => {
  console.log('App: Rendering...')

  const { loadSessions } = useAppStore()

  useEffect(() => {
    console.log('App: Loading sessions on startup...')
    loadSessions().catch((error) => {
      console.error('App: Failed to load sessions:', error)
    })
  }, [loadSessions])

  return (
    <ErrorBoundary>
      <div className="app">
        <MainLayout />
      </div>
    </ErrorBoundary>
  )
}

export default App
