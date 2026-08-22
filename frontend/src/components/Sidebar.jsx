import React from 'react'

const navItems = ['Dashboard', 'Parties', 'Parcels', 'Reports', 'Users', 'Settings']

const Sidebar = ({ activeView, onNavigate, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">📦</div>
        <div>
          <h2>Rathore Shop</h2>
          <p>Parcel Manager</p>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <button
            key={item}
            className={`nav-item ${activeView === item ? 'active' : ''}`}
            onClick={() => onNavigate(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <button className="logout-button" onClick={onLogout}>Logout</button>
    </aside>
  )
}

export default Sidebar
