import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './MainLayout.css'

interface MainLayoutProps {
  children?: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="main-layout">
      <Header onMenuToggle={toggleSidebar} />
      <div className="layout-container">
        <Sidebar isOpen={sidebarOpen} />
        <main className="main-content">
          {children || (
            <div className="welcome-message">
              <h2>Welcome to Product Image Review Platform</h2>
              <p>Select an option from the sidebar to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
