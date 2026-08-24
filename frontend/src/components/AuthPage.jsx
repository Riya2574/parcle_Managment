import React, { useState } from 'react'

const AuthPage = ({ onLogin, externalError = '' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="password-visibility-button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.8 10.8 0 0 1 12 4.9c5.1 0 8.7 4.5 9.8 6.1a1.7 1.7 0 0 1 0 2c-.5.7-1.3 1.7-2.4 2.7M6.2 6.2C4.2 7.5 2.8 9.3 2.2 10.1a1.7 1.7 0 0 0 0 2C3.3 13.7 6.9 18.2 12 18.2c1 0 2-.2 2.8-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M2.2 12.1C3.3 10.5 6.9 5.8 12 5.8s8.7 4.7 9.8 6.3c-1.1 1.6-4.7 6.3-9.8 6.3S3.3 13.7 2.2 12.1Z" />
                    <circle cx="12" cy="12.1" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
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
