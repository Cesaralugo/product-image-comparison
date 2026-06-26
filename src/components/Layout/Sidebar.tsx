// src/components/Layout/Sidebar.tsx
import React from 'react'
import { PageType } from '@/state/store'
import './Sidebar.css'

interface SidebarProps {
  onNavigate?: (page: PageType) => void
  activePage?: PageType
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activePage = 'dashboard' }) => {
  console.log('Sidebar: Rendering...', { activePage })

  const menuItems: { id: PageType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'sessions', label: 'Sessions', icon: '📋' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleNavigate = (pageId: PageType) => {
    console.log('🔗 Sidebar: Navigating to:', pageId)
    if (onNavigate) {
      onNavigate(pageId)
    }
  }

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={activePage === item.id ? 'active' : ''}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
