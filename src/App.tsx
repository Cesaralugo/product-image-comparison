import { useState, useEffect } from 'react'
import MainLayout from './components/Layout/MainLayout'
import { useAppStore } from './state/store'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const { setIsLoading: setStoreLoading } = useAppStore()

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load initial settings, sessions, etc.
        setStoreLoading(false)
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [setStoreLoading])

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return <MainLayout />
}

export default App
