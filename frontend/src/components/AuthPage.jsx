import React, { useState } from 'react'

const AuthPage = ({ onLogin, externalError = '' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error || externalError) setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.')
      return
    }

    setIsSubmitting(true)
    Promise.resolve(onLogin({ email: formData.email, password: formData.password })).finally(() => setIsSubmitting(false))
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-icon auth-brand-icon">📦</div>
          <div>
            <p className="overline">Parcel Manager</p>
            <h1>Welcome back</h1>
            <p className="auth-subtitle">Sign in to manage parcels and party records.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </label>

          {(error || externalError) && <p className="auth-error" role="alert">{error || externalError}</p>}

          <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
