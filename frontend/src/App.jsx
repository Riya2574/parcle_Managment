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
  const [currentUser, setCurrentUser] = useState(null)
  const [branding, setBranding] = useState({ shopName: 'Rathore Shop', logoUrl: '' })
  const isAdmin = currentUser?.role === 'Admin'

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
      api.me().then(async (result) => { setCurrentUser(result.user); setBranding(await api.branding()); setIsAuthenticated(true); return loadData() }).catch(() => {
        api.setToken(null)
        setError('Your session expired. Please sign in again.')
      })
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    const searchTimer = setTimeout(async () => {
      try {
        const searchResults = await api.parcels(topbarSearch)
        setParcelData(searchResults)
        setDashboardData((current) => current ? { ...current, recent: searchResults.slice(0, 10) } : current)
      } catch (requestError) {
        setError(requestError.message)
      }
    }, 250)
    return () => clearTimeout(searchTimer)
  }, [isAuthenticated, topbarSearch])

  useEffect(() => {
    if (!successMessage) return undefined
    const successTimer = setTimeout(() => setSuccessMessage(''), 3000)
    return () => clearTimeout(successTimer)
  }, [successMessage])

  const handleLogin = async (credentials) => {
    try {
      setError('')
      const result = await api.login(credentials)
      api.setToken(result.token)
      setCurrentUser(result.user)
      setBranding(await api.branding())
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
    setCurrentUser(null)
    setSuccessMessage('')
    api.setToken(null)
    setSelectedParty('')
    setTopbarSearch('')
  }

  const handleNavigate = (view) => {
    if (!isAdmin && ['Users', 'Settings'].includes(view)) return
    setActiveView(view)
    setParcelPageInitialParty('')
    setTopbarSearch('')
    setSuccessMessage('')
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
    if (!row) return Promise.reject(new Error('Parcel not found'))
    return api.updateParcel(parcelId, updater(row)).then((updated) => {
      setParcelData((currentRows) => currentRows.map((item) => item.id === parcelId ? updated : item))
      return updated
    }).catch((requestError) => {
      setError(requestError.message)
      throw requestError
    })
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
      <Sidebar activeView={activeView} onNavigate={handleNavigate} onLogout={handleLogout} branding={branding} isAdmin={isAdmin} />
      <main className="dashboard">
        {error && <p className="auth-error">{error}</p>}
        {successMessage && <p className="auth-success" role="status">{successMessage}</p>}
        <Topbar
          user={currentUser}
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
            onDeleteParcel={isAdmin ? handleDeleteParcel : undefined}
            canDelete={isAdmin}
            searchQuery={topbarSearch}
          />
        ) : activeView === 'Parcels' ? (
          <ParcelsPage
            key={parcelPageInitialParty}
            partyOptions={partyList.map((party) => party.name)}
            initialPartyName={parcelPageInitialParty}
            onSaveParcel={handleSaveParcel}
            searchResults={topbarSearch ? parcelData : []}
            searchQuery={topbarSearch}
          />
        ) : activeView === 'Reports' ? (
          <ReportsPage reportRows={reportData} searchQuery={topbarSearch} />
        ) : activeView === 'Users' && isAdmin ? (
          <UsersPage users={users} onCreateStaff={async (staff) => {
            const createdUser = await api.createUser(staff)
            setUsers((current) => [createdUser, ...current])
          }} onUpdateUserStatus={async (user) => {
            const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active'
            const updatedUser = await api.updateUserStatus(user.id, nextStatus)
            setUsers((current) => current.map((item) => item.id === updatedUser.id ? updatedUser : item))
          }} />
        ) : activeView === 'Settings' && isAdmin ? (
          <SettingsPage onNavigate={handleNavigate} onBrandingChange={setBranding} />
        ) : (
          <>
            <StatsGrid data={dashboardData} />
            <section className="dashboard-body">
              <RecentParcels
                parcels={dashboardData?.recent || []}
                onViewAll={() => {
                  setActiveView('Reports')
                  setTopbarSearch('')
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