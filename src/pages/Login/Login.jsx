import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, HeartHandshake } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import { login, saveSession } from '../../lib/api.js'
import './Login.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmedEmail = form.email.trim()
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address, for example name@gmail.com.')
      return
    }
    if (!form.password) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    login({ email: trimmedEmail, password: form.password })
      .then((data) => {
        saveSession(data)
        setSuccess('Signed in successfully.')
        const role = data.user?.role
        const dest = role === 'ADMIN' ? '/admin' : '/dashboard'
        navigate(dest, { replace: true })
      })
      .catch((submitError) => setError(submitError.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <HeartHandshake size={20} /> CareBridge
        </Link>

        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Log in to manage your children’s profiles and appointments.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Email</span>
            <div className="auth-form__input">
              <Mail size={16} />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="auth-form__field">
            <span>Password</span>
            <div className="auth-form__input">
              <Lock size={16} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <div className="auth-form__row">
            <label className="auth-form__checkbox">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="auth-form__link">Forgot password?</a>
          </div>

          {error && <p className="auth-form__message auth-form__message--error" role="alert">{error}</p>}
          {success && <p className="auth-form__message auth-form__message--success" role="status">{success}</p>}

          <Button type="submit" variant="primary" className="auth-form__submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="auth-card__footer">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
