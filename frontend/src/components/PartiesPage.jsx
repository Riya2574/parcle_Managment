import React, { useEffect, useMemo, useState } from 'react'

const PartiesPage = ({ partyList = [], parcelData = [], selectedPartyName = '', onPartyChange, onCreateParty, onDeleteParty, onGoToParcels, onUpdateParcel, onDeleteParcel, searchQuery = '' }) => {
  const [partySearch, setPartySearch] = useState('')
  const [tableSearch, setTableSearch] = useState('')
  const [tableStatus, setTableStatus] = useState('All Status')
  const [showAddPartyForm, setShowAddPartyForm] = useState(false)
  const [newPartyName, setNewPartyName] = useState('')
  const [newPartyPhone, setNewPartyPhone] = useState('')
  const [newPartyLocation, setNewPartyLocation] = useState('')

  useEffect(() => {
    if (!partyList.length) {
      if (onPartyChange) onPartyChange('')
      return
    }

    const matchedParty = partyList.find((party) => party.name === selectedPartyName)
    if (!matchedParty) {
      const fallbackParty = partyList[0]
      if (onPartyChange && fallbackParty.name !== selectedPartyName) onPartyChange(fallbackParty.name)
    }
  }, [partyList, selectedPartyName, onPartyChange])

  const selectedParty = useMemo(
    () => partyList.find((party) => party.name === selectedPartyName) || partyList[0] || null,
    [partyList, selectedPartyName]
  )

  const topbarSearch = searchQuery.trim().toLowerCase()

  const selectedPartyParcels = useMemo(
    () => (selectedParty ? parcelData.filter((row) => row.partyId === selectedParty.id) : []),
    [parcelData, selectedParty]
  )

  const filteredTableRows = useMemo(() => {
    if (!selectedParty) return []

    const combinedQuery = (tableSearch || topbarSearch).trim().toLowerCase()

    return parcelData.filter((row) => {
      const partyMatches = row.partyId === selectedParty.id
      const queryMatches = !combinedQuery || [row.id, row.customerName, row.phone, row.product].some((value) => String(value).toLowerCase().includes(combinedQuery))
      const statusMatches = tableStatus === 'All Status' || row.status === tableStatus
      return partyMatches && queryMatches && statusMatches
    })
  }, [parcelData, selectedParty, tableSearch, tableStatus, topbarSearch])

  const visiblePartyList = useMemo(() => {
    const normalizedPartySearch = partySearch.trim().toLowerCase()
    return partyList.filter((party) => {
      const matchesPartyName = !normalizedPartySearch || party.name.toLowerCase().includes(normalizedPartySearch)
      const matchesTopbar = !topbarSearch || [party.name, party.city, party.phone].some((value) => String(value).toLowerCase().includes(topbarSearch))
      return matchesPartyName && matchesTopbar
    })
  }, [partyList, partySearch, topbarSearch])

  const handleToggleParcelStatus = (parcelId) => {
    if (!onUpdateParcel) return

    onUpdateParcel(parcelId, (row) => {
      const nextStatus = row.status === 'Received' ? 'Pending' : 'Received'
      return {
        status: nextStatus,
        payment: nextStatus === 'Received' ? row.payment ?? '' : ''
      }
    })
  }

  const handlePaymentChange = (parcelId, value) => {
    if (!onUpdateParcel) return
    onUpdateParcel(parcelId, () => ({ payment: value }))
  }

  const handleDeleteParty = (partyId) => {
    if (onDeleteParty) {
      onDeleteParty(partyId)
    }
  }

  const handleToggleAddPartyForm = () => {
    setShowAddPartyForm((current) => !current)
  }

  const handleCreateParty = (event) => {
    event.preventDefault()
    const cleanName = newPartyName.trim()
    if (!cleanName) return

    const nextParty = {
      name: cleanName,
      city: newPartyLocation.trim() || 'N/A',
      phone: newPartyPhone.trim() || 'N/A',
      status: 'Active',
      type: 'Retailer'
    }

    if (onCreateParty) {
      onCreateParty(nextParty)
    }

    setNewPartyName('')
    setNewPartyPhone('')
    setNewPartyLocation('')
    setShowAddPartyForm(false)
  }

  const handleAddParcel = () => {
    if (onGoToParcels && selectedParty) {
      onGoToParcels(selectedParty.name)
    }
  }

  const partySummaryCards = selectedParty ? [
    { title: 'Total Parcels', value: String(selectedPartyParcels.length), detail: 'Live parcels', tone: 'blue' },
    { title: 'Pending', value: String(selectedPartyParcels.filter((row) => row.status === 'Pending').length), detail: 'In progress', tone: 'orange' },
    { title: 'Received', value: String(selectedPartyParcels.filter((row) => row.status === 'Received').length), detail: 'Completed parcels', tone: 'green' }
  ] : []

  if (!partyList.length) {
    return (
      <section className="parties-page">
        <header className="main-header party-header">
          <div>
            <h1 className="page-title">Parties</h1>
          </div>
        </header>
        <div className="card report-card empty-parties-card">
          <div className="panel-title-row">
            <div>
              <h2>No parties available</h2>
              <p>Add your first party to start tracking parcels.</p>
            </div>
            <button className="primary-button" onClick={handleToggleAddPartyForm} type="button">
              {showAddPartyForm ? 'Cancel' : '+ Add Party'}
            </button>
          </div>
          {showAddPartyForm && (
            <form className="party-add-form" onSubmit={handleCreateParty}>
              <div className="form-row">
                <input type="text" className="party-input" value={newPartyName} onChange={(event) => setNewPartyName(event.target.value)} placeholder="Party name" required />
                <input type="text" className="party-input" value={newPartyPhone} onChange={(event) => setNewPartyPhone(event.target.value)} placeholder="Phone no." />
                <input type="text" className="party-input" value={newPartyLocation} onChange={(event) => setNewPartyLocation(event.target.value)} placeholder="Location" />
              </div>
              <div className="form-actions">
                <button className="primary-button small-button" type="submit">Add Party</button>
              </div>
            </form>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="parties-page">
      <header className="main-header party-header">
        <div>
          <h1 className="page-title">Parties</h1>
        </div>
      </header>

      <section className="party-dashboard-layout">
        <aside className="party-list-panel card">
          <div className="panel-title-row">
            <div>
              <div className="panel-title">All Parties</div>
            </div>
            <button className="primary-button small-button" onClick={handleToggleAddPartyForm} type="button">+ Add Party</button>
          </div>
          {showAddPartyForm && (
            <form className="party-add-form" onSubmit={handleCreateParty}>
              <div className="form-row">
                <input
                  type="text"
                  className="party-input"
                  value={newPartyName}
                  onChange={(event) => setNewPartyName(event.target.value)}
                  placeholder="Party name"
                />
                <input
                  type="text"
                  className="party-input"
                  value={newPartyPhone}
                  onChange={(event) => setNewPartyPhone(event.target.value)}
                  placeholder="Phone no."
                />
                <input
                  type="text"
                  className="party-input"
                  value={newPartyLocation}
                  onChange={(event) => setNewPartyLocation(event.target.value)}
                  placeholder="Location"
                />
              </div>
              <div className="form-actions">
                <button className="primary-button small-button" type="submit">Add</button>
                <button className="secondary-button small-button" type="button" onClick={() => {
                  setShowAddPartyForm(false)
                  setNewPartyName('')
                  setNewPartyPhone('')
                  setNewPartyLocation('')
                }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="party-search-wrap">
            <div className="search-field party-search-field">
              <span aria-hidden="true" className="search-icon">⌕</span>
              <input
                type="text"
                value={partySearch}
                onChange={(event) => setPartySearch(event.target.value)}
                placeholder="Search parties..."
              />
            </div>
          </div>

          <div className="party-card-list">
            {visiblePartyList.length === 0 ? (
              <div className="empty-row">No parties match your search.</div>
            ) : visiblePartyList.map((party) => {
              const partyParcels = parcelData.filter((row) => row.partyId === party.id)
              const partyPending = partyParcels.filter((row) => row.status === 'Pending').length

              return (
                <button
                  key={party.id}
                  type="button"
                  className={`party-card ${selectedParty?.id === party.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (onPartyChange) onPartyChange(party.name)
                  }}
                >
                  <span className="party-avatar-badge">{party.name.charAt(0)}</span>
                  <span className="party-card-content">
                    <span className="party-card-name">{party.name}</span>
                    <span className="party-card-location">{party.city}</span>
                    <span className="party-card-meta">
                      <span>{partyParcels.length} Parcels</span>
                      <span className="separator-dot" />
                      <span className="party-pending-count">{partyPending} Pending</span>
                    </span>
                  </span>
                  <span className="active-status-dot" aria-label="Active party"></span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="party-details-panel card">
          {selectedParty ? (
            <>
              <div className="details-header">
                <div>
                  <div className="detail-kicker">Selected Party</div>
                  <h2 className="detail-title">{selectedParty.name}</h2>
                  <div className="detail-subtitle">
                    <span>{selectedParty.city}</span>
                    <span className="separator-dot"></span>
                    <span>{selectedParty.phone}</span>
                  </div>
                </div>
                <div className="details-actions">
                  <span className="status-pill status-active">Active</span>
                  <button
                    type="button"
                    className="secondary-button small-button"
                    onClick={() => handleDeleteParty(selectedParty.id)}
                  >
                    Delete Party
                  </button>
                </div>
              </div>

              <div className="summary-card-grid">
                {partySummaryCards.map((card) => (
                  <article key={card.title} className={`summary-card ${card.tone}`}>
                    <div className="summary-card-top">
                      <span className={`summary-title ${card.tone}`}>{card.title}</span>
                    </div>
                    <div className="summary-value">{card.value}</div>
                    <div className="summary-detail">{card.detail}</div>
                  </article>
                ))}
              </div>

              <section className="parcel-table-section">
                <div className="table-topbar">
                  <div className="panel-title">Parcels of {selectedParty.name}</div>
                  <button className="primary-button add-parcel-button" onClick={handleAddParcel}>+ Add Parcel for this Party</button>
                </div>

                <div className="table-controls">
                  <select className="select-control" value={selectedParty.id} onChange={(event) => {
                    const nextParty = partyList.find((party) => party.id === event.target.value)
                    if (nextParty && onPartyChange) onPartyChange(nextParty.name)
                  }}>
                    {partyList.map((party) => (
                      <option key={party.id} value={party.id}>{party.name}</option>
                    ))}
                  </select>

                  <label className="table-search-field">
                    <span aria-hidden="true">⌕</span>
                    <input
                      value={tableSearch}
                      onChange={(event) => setTableSearch(event.target.value)}
                      placeholder="Search by SR No, Customer, Phone, Product..."
                    />
                  </label>

                  <select className="select-control" value={tableStatus} onChange={(event) => setTableStatus(event.target.value)}>
                    <option value="All Status">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                  </select>
                </div>

                <div className="table-wrap modern-table-wrap">
                  <table className="parcel-table">
                    <thead>
                      <tr>
                        <th>SR No</th>
                        <th>Customer Name</th>
                        <th>Phone No</th>
                        <th>Product</th>
                        <th>Sent Date</th>
                        <th>Status</th>
                        <th>Received Date</th>
                        <th>Payment</th>
                        <th>Updated By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableRows.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="empty-row">No parcels found</td>
                        </tr>
                      ) : (
                        filteredTableRows.map((row) => (
                          <tr key={row.id}>
                            <td className="sr-no">{row.id}</td>
                            <td>{row.customerName}</td>
                            <td>{row.phone}</td>
                            <td>{row.product}</td>
                            <td>{row.sentDate}</td>
                            <td>
                              <span className={`status-pill ${row.status === 'Received' ? 'status-received' : 'status-pending'}`}>{row.status}</span>
                            </td>
                            <td>{row.receivedDate}</td>
                            <td>
                              {row.status === 'Received' ? (
                                <input
                                  type="text"
                                  className="payment-input"
                                  value={row.payment || ''}
                                  onChange={(event) => handlePaymentChange(row.id, event.target.value)}
                                  placeholder="Enter payment"
                                />
                              ) : (
                                <span className="payment-placeholder">-</span>
                              )}
                            </td>
                            <td>{row.updatedBy}</td>
                            <td>
                              <div className="table-actions">
                                <button type="button" className="icon-button" onClick={() => handleToggleParcelStatus(row.id)}>{row.status === 'Received' ? 'Mark Pending' : 'Mark Received'}</button>
                                <button type="button" className="icon-button danger" onClick={() => onDeleteParcel && onDeleteParcel(row.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="empty-row">Select a party to view details.</div>
          )}
        </section>
      </section>
    </section>
  )
}

export default PartiesPage
