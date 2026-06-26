// src/components/Layout/Header.tsx
import React from 'react'
import { useAppStore } from '@/state/store'
import './Header.css'

const Header: React.FC = () => {
  console.log('Header: Rendering...')

  const { currentPage } = useAppStore()

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    sessions: 'Sessions',
    gallery: 'Gallery',
    reports: 'Reports',
    settings: 'Settings'
  }

  return (
    <header className="header">
      <div className="header-content">
        <h1>Product Image Review Platform</h1>
        <span className="header-page">{pageTitles[currentPage] || 'Dashboard'}</span>
      </div>
    </header>
  )
}

export default Header
