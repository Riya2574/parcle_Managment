const API_URL = import.meta.env.VITE_API_URL || '/api'

let token = localStorage.getItem('parcel_token')

const request = async (path, options = {}) => {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    })
  } catch {
    throw new Error('Backend server is not running. Start the app with npm run dev from the project folder.')
  }
  const responseText = response.status === 204 ? '' : await response.text()
  let body = null
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      throw new Error(`Request failed with status ${response.status}`)
    }
  }
  if (!response.ok) {
    const fieldErrors = Object.values(body?.details?.fieldErrors || {}).flat()
    throw new Error(fieldErrors.length ? fieldErrors.join(' ') : body?.error || 'Request failed')
  }
  return body
}

export const api = {
  setToken(value) {
    token = value
    if (value) localStorage.setItem('parcel_token', value)
    else localStorage.removeItem('parcel_token')
  },
  getToken() { return token },
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  changePassword: (data) => request('/auth/password', { method: 'PATCH', body: JSON.stringify(data) }),
  parties: () => request('/parties'),
  createParty: (data) => request('/parties', { method: 'POST', body: JSON.stringify(data) }),
  deleteParty: (id) => request(`/parties/${id}`, { method: 'DELETE' }),
  parcels: (search = '') => request(`/parcels${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createParcel: (data) => request('/parcels', { method: 'POST', body: JSON.stringify(data) }),
  updateParcel: (id, data) => request(`/parcels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteParcel: (id) => request(`/parcels/${id}`, { method: 'DELETE' }),
  dashboard: () => request('/dashboard/summary'),
  reports: () => request('/reports/parcels'),
  users: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserStatus: (id, status) => request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  settings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  branding: () => request('/branding'),
  createBackup: () => request('/backups', { method: 'POST' })
}
