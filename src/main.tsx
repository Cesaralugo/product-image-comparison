// src/App.tsx
import React from 'react'
import { useAppStore } from './state/store'
import MainLayout from './components/Layout/MainLayout'
import './App.css'

const App: React.FC = () => {
  // Remove setIsLoading if it doesn't exist in the store
  // const { setIsLoading: setStoreLoading } = useAppStore()
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
