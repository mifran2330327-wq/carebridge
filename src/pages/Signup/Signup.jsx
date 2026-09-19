import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, HeartHandshake } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import { register, saveSession } from '../../lib/api.js'
import TagInput from '../../components/TagInput/TagInput.jsx'
import './Signup.css'

export default function Signup() {
  const [form, setForm] = useState({ role: 'PARENT', name: '', email: '', password: '', specialties: [], degrees: [], professionType: 'Doctor', location: '', phone: '', description: '', visitingDays: '', visitingHours: '', chamber: '', licenseAuthority: '', licenseNumber: '', nidNumber: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address, for example name@gmail.com.')
      return
    }
    if (form.password.length < 8) {
      setError('Your password must be at least 8 characters long.')
      return
    }
    if (form.role === 'DOCTOR' && (!form.specialties.length || !form.degrees.length || !form.location.trim() || !form.visitingDays.trim() || !form.visitingHours.trim() || !form.nidNumber.trim())) {
      setError('Doctors must provide specialty, qualification, location, available days, and available hours.')
      return
    }
    setLoading(true)
    register({ name: trimmedName, email: trimmedEmail, password: form.password, role: form.role, professional: form.role === 'DOCTOR' ? {
      specialties: form.specialties, degrees: form.degrees, professionType: form.professionType, location: form.location,
      phone: form.phone, description: form.description, visitingDays: form.visitingDays, visitingHours: form.visitingHours, chamber: form.chamber, licenseAuthority: form.licenseAuthority, licenseNumber: form.licenseNumber, nidNumber: form.nidNumber,
    } : undefined })
      .then((data) => {
        saveSession(data)
        setSuccess('Account created successfully. Opening your dashboard...')
        window.setTimeout(() => { window.location.href = '/dashboard' }, 700)
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

        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">
          Choose the account that matches how you use CareBridge.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__roles" role="group" aria-label="Account type">
            <button type="button" className={form.role === 'PARENT' ? 'auth-form__role auth-form__role--active' : 'auth-form__role'} onClick={() => setForm((current) => ({ ...current, role: 'PARENT' }))}>Parent</button>
            <button type="button" className={form.role === 'DOCTOR' ? 'auth-form__role auth-form__role--active' : 'auth-form__role'} onClick={() => setForm((current) => ({ ...current, role: 'DOCTOR' }))}>Doctor / professional</button>
          </div>
          <label className="auth-form__field">
            <span>Full name</span>
            <div className="auth-form__input">
              <User size={16} />
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          {form.role === 'DOCTOR' && <>
            <label className="auth-form__field"><span>Profession type</span><div className="auth-form__input"><input list="profession-types" name="professionType" value={form.professionType} onChange={handleChange} required /><datalist id="profession-types"><option>Doctor</option><option>Speech Therapist</option><option>Occupational Therapist</option><option>Physiotherapist</option><option>Child Psychologist</option><option>Special Education Teacher</option><option>Behavioural Therapist</option></datalist></div></label>
            <TagInput label="Degrees / qualifications" kind="degrees" values={form.degrees} onChange={(degrees) => setForm((current) => ({ ...current, degrees }))} placeholder="Type MBBS, FCPS..." />
            <TagInput label="Expertise / specialties" kind="specialties" values={form.specialties} onChange={(specialties) => setForm((current) => ({ ...current, specialties }))} placeholder="Type autism, ADHD..." />
            {[
              ['location', 'Practice location', 'City, institution, or chamber'],
              ['phone', 'Phone number', 'Optional contact number'],
              ['visitingDays', 'Available days', 'e.g. Saturday, Monday, Wednesday'],
              ['visitingHours', 'Available hours', 'e.g. 5pm - 9pm'],
              ['chamber', 'Hospital/school location', 'Where parents can visit you'],
              ['licenseAuthority', 'License authority', 'e.g. BM&DC or Other / Not applicable'],
              ['licenseNumber', 'License number', 'Optional unless required by your profession'],
              ['nidNumber', 'NID number', 'Required for verification'],
            ].map(([name, label, placeholder]) => (
              <label className="auth-form__field" key={name}>
                <span>{label}</span>
                <div className="auth-form__input"><input type="text" name={name} placeholder={placeholder} value={form[name]} onChange={handleChange} required={['specialty', 'qualification', 'location'].includes(name)} /></div>
              </label>
            ))}
            <label className="auth-form__field"><span>Professional description</span><textarea name="description" placeholder="Services, experience, and areas of care" value={form.description} onChange={handleChange} rows="3" /></label>
          </>}

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
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="auth-form__terms">
            <input type="checkbox" required />
            I agree to the Terms of Service and Privacy Policy
          </label>

          {error && <p className="auth-form__message auth-form__message--error" role="alert">{error}</p>}
          {success && <p className="auth-form__message auth-form__message--success" role="status">{success}</p>}

          <Button type="submit" variant="primary" className="auth-form__submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
