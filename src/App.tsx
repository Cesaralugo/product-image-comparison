// src/App.tsx
import React from 'react'
import { useAppStore } from './state/store'
import MainLayout from './components/Layout/MainLayout'
import './App.css'

const App: React.FC = () => {
  // Remove the setIsLoading reference since it doesn't exist in the store
  // The store has 'setLoading' instead of 'setIsLoading'
  const { loadSessions } = useAppStore()

  // Load sessions on mount
  React.useEffect(() => {
    loadSessions().catch(console.error)
  }, [loadSessions])

  return (
    <div className="app">
      <MainLayout />
    </div>
  )
}

export default App
