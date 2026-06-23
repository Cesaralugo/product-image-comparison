import './Header.css'

interface HeaderProps {
  onMenuToggle: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="app-header">
      <button className="menu-toggle" onClick={onMenuToggle} title="Toggle sidebar">
        ☰
      </button>
      <h1 className="app-title">Product Image Review Platform</h1>
      <div className="header-actions">
        {/* Header actions will be added here */}
      </div>
    </header>
  )
}

export default Header
