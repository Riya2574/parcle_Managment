import React, { useEffect, useState } from 'react'
import { api } from './api.js'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import StatsGrid from './components/StatsGrid.jsx'
import RecentParcels from './components/RecentParcels.jsx'
import StatusSummary from './components/StatusSummary.jsx'
import PartiesPage from './components/PartiesPage.jsx'
import ParcelsPage from './components/ParcelsPage.jsx'
import ReportsPage from './components/ReportsPage.jsx'
import UsersPage from './components/UsersPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import AuthPage from './components/AuthPage.jsx'

const App = () => {
  const [activeView, setActiveView] = useState('Dashboard')
  const [selectedParty, setSelectedParty] = useState('')
  const [topbarSearch, setTopbarSearch] = useState('')
  const [partyList, setPartyList] = useState([])
  const [parcelData, setParcelData] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [reportData, setReportData] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [parcelPageInitialParty, setParcelPageInitialParty] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadData = async () => {
    const [partiesResult, parcelsResult, dashboardResult, reportsResult, usersResult] = await Promise.allSettled([
      api.parties(),
      api.parcels(),
      api.dashboard(),
      api.reports(),
      api.users()
    ])

    const parties = partiesResult.status === 'fulfilled' ? partiesResult.value : []
    const parcels = parcelsResult.status === 'fulfilled' ? parcelsResult.value : []
    const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
    const reports = reportsResult.status === 'fulfilled' ? reportsResult.value : []
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value : []

    if (partiesResult.status === 'rejected') setError(partiesResult.reason?.message || 'Could not load parties.')
    if (parcelsResult.status === 'rejected') setError((current) => current || parcelsResult.reason?.message || 'Could not load parcels.')
    if (dashboardResult.status === 'rejected') setError((current) => current || dashboardResult.reason?.message || 'Could not load dashboard summary.')
    if (reportsResult.status === 'rejected') setError((current) => current || reportsResult.reason?.message || 'Could not load reports.')
    if (usersResult.status === 'rejected') setError((current) => current || usersResult.reason?.message || 'Could not load users.')

    setPartyList(parties)
    setParcelData(parcels)
    setDashboardData(dashboard)
    setReportData(reports)
    setUsers(usersData)
    setSelectedParty((current) => {
      if (parties.length === 0) return ''
      if (current && parties.some((party) => party.name === current)) return current
      return parties[0].name
    })
  }

  useEffect(() => {
    if (api.getToken()) {
      api.me().then(() => { setIsAuthenticated(true); return loadData() }).catch(() => {
        api.setToken(null)
        setError('Your session expired. Please sign in again.')
      })
    }
  }, [])

  const handleLogin = async (credentials) => {
    try {
      setError('')
      const result = await api.login(credentials)
      api.setToken(result.token)
      setIsAuthenticated(true)
      await loadData()
      setSuccessMessage('Login successful.')
    } catch (requestError) {
      setIsAuthenticated(false)
      setError(requestError.message)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    api.setToken(null)
    setSelectedParty('')
    setTopbarSearch('')
  }

  const handleNavigate = (view) => {
    setActiveView(view)
    setParcelPageInitialParty('')
    setTopbarSearch('')
  }

  const handleGoToParcels = (partyName) => {
    setSelectedParty(partyName)
    setParcelPageInitialParty(partyName)
    setActiveView('Parcels')
  }

  const handleCreateParty = async (newParty) => {
    try {
      const party = await api.createParty(newParty)
      setPartyList((current) => [party, ...current])
      setSelectedParty(party.name)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDeleteParty = (partyId) => {
    const deletedParty = partyList.find((party) => party.id === partyId)
    if (deletedParty && !window.confirm(`Are you sure you want to delete ${deletedParty.name}?`)) {
      return
    }

    api.deleteParty(partyId).then(() => {
      const nextParties = partyList.filter((party) => party.id !== partyId)
      setPartyList(nextParties)
      setParcelData((currentRows) => currentRows.filter((row) => row.partyId !== partyId))
      if (deletedParty?.name === selectedParty) {
        setSelectedParty(nextParties[0]?.name || '')
      }
    }).catch((requestError) => setError(requestError.message))
  }

  const handleUpdateParcel = (parcelId, updater) => {
    const row = parcelData.find((item) => item.id === parcelId)
    if (!row) return
    api.updateParcel(parcelId, updater(row)).then((updated) => setParcelData((currentRows) => currentRows.map((item) => item.id === parcelId ? updated : item))).catch((requestError) => setError(requestError.message))
  }

  const handleDeleteParcel = (parcelId) => {
    api.deleteParcel(parcelId).then(() => setParcelData((currentRows) => currentRows.filter((row) => row.id !== parcelId))).catch((requestError) => setError(requestError.message))
  }

  const handleSaveParcel = (formData) => {
    const party = partyList.find((partyItem) => partyItem.name === formData.party)
    api.createParcel({
      partyId: party?.id,
      customerName: formData.customerName,
      phone: formData.number,
      product: formData.product,
      sentDate: formData.sendDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: formData.receivedStatus || 'Pending',
      payment: ''
    }).then((parcel) => { setParcelData((currentRows) => [parcel, ...currentRows]); setParcelPageInitialParty(''); setActiveView('Parties') }).catch((requestError) => setError(requestError.message))
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} externalError={error} />
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} onLogout={handleLogout} />
      <main className="dashboard">
        {error && <p className="auth-error">{error}</p>}
        {successMessage && <p className="auth-success" role="status">{successMessage}</p>}
        <Topbar
          activeView={activeView}
          selectedParty={selectedParty}
          partyOptions={partyList.map((party) => party.name)}
          onPartyChange={setSelectedParty}
          searchValue={topbarSearch}
          onSearchChange={setTopbarSearch}
        />
        {activeView === 'Parties' ? (
          <PartiesPage
            partyList={partyList}
            parcelData={parcelData}
            selectedPartyName={selectedParty}
            onPartyChange={setSelectedParty}
            onCreateParty={handleCreateParty}
            onDeleteParty={handleDeleteParty}
            onGoToParcels={handleGoToParcels}
            onUpdateParcel={handleUpdateParcel}
            onDeleteParcel={handleDeleteParcel}
            searchQuery={topbarSearch}
          />
        ) : activeView === 'Parcels' ? (
          <ParcelsPage
            key={parcelPageInitialParty}
            partyOptions={partyList.map((party) => party.name)}
            initialPartyName={parcelPageInitialParty}
            onSaveParcel={handleSaveParcel}
          />
        ) : activeView === 'Reports' ? (
          <ReportsPage reportRows={reportData} searchQuery={topbarSearch} />
        ) : activeView === 'Users' ? (
          <UsersPage users={users} onCreateStaff={async (staff) => {
            const createdUser = await api.createUser(staff)
            setUsers((current) => [createdUser, ...current])
          }} />
        ) : activeView === 'Settings' ? (
          <SettingsPage />
        ) : (
          <>
            <StatsGrid data={dashboardData} />
            <section className="dashboard-body">
              <RecentParcels
                parcels={dashboardData?.recent || []}
                onViewAll={() => {
                  setActiveView('Parcels')
                  setParcelPageInitialParty('')
                }}
              />
              <StatusSummary data={dashboardData} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App