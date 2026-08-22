import React from 'react'

const Topbar = ({ selectedParty = '', partyOptions = [], onPartyChange = () => {}, searchValue = '', onSearchChange = () => {} }) => {
  return (
    <header className="topbar admin-topbar">
      <div className="topbar-left">
        <label className="topbar-label" htmlFor="topbar-select-party">Select Party</label>
        <div className="topbar-select-wrap">
          <select id="topbar-select-party" className="topbar-select" value={selectedParty} onChange={(event) => onPartyChange(event.target.value)}>
            {partyOptions.length === 0 ? <option value="">No parties</option> : partyOptions.map((party) => (
              <option key={party} value={party}>{party}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <span aria-hidden="true" className="search-icon">⌕</span>
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by SR No, Customer, Phone, Product..."
          />
          <span className="search-button">⌕</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="profile-chip top-profile-chip">
          <div className="profile-avatar">RA</div>
          <div className="profile-copy">
            <strong>Riya Admin</strong>
            <span>Admin</span>
          </div>
          <span className="profile-chevron" aria-hidden="true">⌄</span>
        </div>
      </div>
    </header>
  )
}

export default Topbar
