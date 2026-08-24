import React from 'react'

const navItems = [
  { label: 'Dashboard', adminOnly: false },
  { label: 'Parties', adminOnly: false },
  { label: 'Parcels', adminOnly: false },
  { label: 'Reports', adminOnly: false },
  { label: 'Users', adminOnly: true },
  { label: 'Settings', adminOnly: true }
]

const Sidebar = ({ activeView, onNavigate, onLogout, branding = {}, isAdmin = false }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        {branding.logoUrl ? <img className="brand-icon" src={branding.logoUrl} alt="Shop logo" /> : <div className="brand-icon">📦</div>}
        <div>
          <h2>{branding.shopName || 'Rathore Shop'}</h2>
          <p>Parcel Manager</p>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <button
            key={item.label}
            className={`nav-item ${activeView === item.label ? 'active' : ''}`}
            onClick={() => onNavigate(item.label)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button className="logout-button" onClick={onLogout}>Logout</button>
    </aside>
  )
}

export default Sidebar
