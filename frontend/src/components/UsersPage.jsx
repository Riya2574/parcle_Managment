import React, { useState } from 'react'

const UsersPage = ({ users = [], onCreateStaff, onUpdateUserStatus }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Staff' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onCreateStaff(formData)
      setFormData({ name: '', email: '', password: '', role: 'Staff' })
      setShowForm(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="parties-page">
      <div className="page-header">
        <div>
          <p className="overline">User Management</p>
          <h1>Users Overview</h1>
          <p className="page-subtitle">Admins can create Staff accounts for daily operations.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form className="card user-form" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Create User Account</h2>
              <p className="section-copy">Choose whether this account should be Admin or Staff.</p>
            </div>
          </div>
          <div className="form-grid">
            <label><span>Name</span><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
            <label><span>Email</span><input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
            <label><span>Password</span><input required minLength="8" type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} /></label>
            <label><span>Role</span><select value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })}><option value="Staff">Staff</option><option value="Admin">Admin</option></select></label>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create User'}</button>
        </form>
      )}

      <div className="parties-stats">
        <article className="stat-card stat-blue">
          <div className="stat-header">
            <span>Total Users</span>
            <div className="stat-icon">👤</div>
          </div>
          <h2>{users.length}</h2>
          <p>Across all departments</p>
        </article>

        <article className="stat-card stat-green">
          <div className="stat-header">
            <span>Admins</span>
            <div className="stat-icon">🛡️</div>
          </div>
          <h2>{users.filter((user) => user.role === 'Admin').length}</h2>
          <p>Full access users</p>
        </article>

        <article className="stat-card stat-orange">
          <div className="stat-header">
            <span>Staff</span>
            <div className="stat-icon">🧑‍💼</div>
          </div>
          <h2>{users.filter((user) => user.role === 'Staff').length}</h2>
          <p>Daily operations users</p>
        </article>

      </div>

      <div className="card report-card">
        <div className="section-header">
          <div>
            <h2>User List</h2>
            <p className="section-copy">All registered users with their role and status.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                  <td>{user.role === 'Staff' && <button type="button" className="secondary-button" onClick={() => { if (user.status !== 'Active' || window.confirm(`Remove ${user.name} from active staff?`)) onUpdateUserStatus(user) }}>{user.status === 'Active' ? 'Remove' : 'Restore'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default UsersPage
