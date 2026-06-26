// src/main.tsx - Phase 2 (Points to main App)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'  // ← Changed from AppMinimal to App
import './styles/globals.css'

console.log('🚀 Phase 2: Starting with App...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('✅ Phase 2: App rendered!')
