import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

const settingsItems = [
  {
    key: 'staffAccess',
    title: 'Staff add/remove',
    description: 'Manage which staff members can access the system.'
  },
  {
    key: 'passwordPolicy',
    title: 'Password change',
    description: 'Allow secure password updates for staff accounts.'
  },
  {
    key: 'branding',
    title: 'Shop name/logo',
    description: 'Update the business name and branding image.'
  },
  {
    key: 'backup',
    title: 'Backup',
    description: 'Create and restore backup copies of your data.'
  },
  {
    key: 'notifications',
    title: 'Notification settings',
    description: 'Control alerts, emails, and reminders.'
  }
]

const SettingsPage = () => {
  const [settings, setSettings] = useState({})
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    api.settings().then((currentSettings) => setSettings(currentSettings)).catch((error) => setStatusMessage(error.message))
  }, [])

  const handleManage = async (item) => {
    const nextValue = settings[item.key] === 'enabled' ? 'disabled' : 'enabled'
    try {
      const nextSettings = await api.updateSettings({ [item.key]: nextValue })
      setSettings(nextSettings)
      setStatusMessage(`${item.title} updated successfully.`)
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  return (
    <section className="parties-page">
      <div className="page-header">
        <div>
          <p className="overline">Settings</p>
          <h1>System Settings</h1>
          <p className="page-subtitle">Manage your shop configuration and account preferences.</p>
        </div>
      </div>

      <div className="card report-card">
        <div className="section-header">
          <div>
            <h2>Configuration Options</h2>
            <p className="section-copy">Choose the area you want to update.</p>
          </div>
        </div>

        {statusMessage && <p className="auth-success">{statusMessage}</p>}

        <div className="settings-list">
          {settingsItems.map((item) => (
            <div key={item.title} className="setting-item">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => handleManage(item)}>
                {settings[item.key] === 'enabled' ? 'Enabled' : 'Manage'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SettingsPage
