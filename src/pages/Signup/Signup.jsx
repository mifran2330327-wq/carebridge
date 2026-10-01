import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, HeartHandshake } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import { register, saveSession } from '../../lib/api.js'
import TagInput from '../../components/TagInput/TagInput.jsx'
import './Signup.css'

export default function Signup() {
  const [form, setForm] = useState({
    role: 'PARENT',
    name: '',
    email: '',
    password: '',
    specialties: [],
    degrees: [],
    professionType: 'Doctor',
    location: '',
    phone: '',
    description: '',
    visitingDays: '',
    visitingHours: '',
    chamber: '',
    licenseAuthority: '',
    licenseNumber: '',
    nidNumber: '',
    isDabMember: false,
    dabSerial: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    // Clear previous error while the user is correcting the form
    if (error) {
      setError('')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()

    setError('')

    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()

    // Name validation
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }

    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError(
        'Please enter a valid email address, for example name@gmail.com.'
      )
      return
    }

    // Password validation
    if (form.password.length < 8) {
      setError('Your password must be at least 8 characters long.')
      return
    }

    // Doctor validation
    if (form.role === 'DOCTOR') {
      if (!form.degrees.length) {
        setError('Please add at least one qualification or degree.')
        return
      }

      if (!form.specialties.length) {
        setError('Please add at least one specialty or area of expertise.')
        return
      }

      if (!form.location.trim()) {
        setError('Please provide your practice location.')
        return
      }

      if (!form.visitingDays.trim()) {
        setError('Please provide your available days.')
        return
      }

      if (!form.visitingHours.trim()) {
        setError('Please provide your available hours.')
        return
      }

      if (!form.nidNumber.trim()) {
        setError('Please provide your NID number for verification.')
        return
      }

      if (form.isDabMember && !form.dabSerial.trim()) {
        setError('Please provide a DAB serial number for DAB membership.')
        return
      }
    }

    setLoading(true)

    const professional =
      form.role === 'DOCTOR'
        ? {
            specialties: form.specialties,
            degrees: form.degrees,
            professionType: form.professionType.trim(),
            location: form.location.trim(),
            phone: form.phone.trim(),
            description: form.description.trim(),
            visitingDays: form.visitingDays.trim(),
            visitingHours: form.visitingHours.trim(),
            chamber: form.chamber.trim(),
            licenseAuthority: form.licenseAuthority.trim(),
            licenseNumber: form.licenseNumber.trim(),
            nidNumber: form.nidNumber.trim(),
            isDabMember: form.isDabMember,
            dabSerial: form.isDabMember
              ? form.dabSerial.trim()
              : null,
          }
        : undefined

    register({
      name: trimmedName,
      email: trimmedEmail,
      password: form.password,
      role: form.role,
      professional,
    })
      .then((data) => {
        saveSession(data)
        navigate('/dashboard', { replace: true })
      })
      .catch((submitError) => {
        setError(
          submitError?.message ||
            'Unable to create your account. Please try again.'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <HeartHandshake size={20} />
          CareBridge
        </Link>

        <h1 className="auth-card__title">
          Create your account
        </h1>

        <p className="auth-card__subtitle">
          Choose the account that matches how you use CareBridge.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Account type */}
          <div
            className="auth-form__roles"
            role="group"
            aria-label="Account type"
          >
            <button
              type="button"
              className={
                form.role === 'PARENT'
                  ? 'auth-form__role auth-form__role--active'
                  : 'auth-form__role'
              }
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  role: 'PARENT',
                }))
                setError('')
              }}
            >
              Parent
            </button>

            <button
              type="button"
              className={
                form.role === 'DOCTOR'
                  ? 'auth-form__role auth-form__role--active'
                  : 'auth-form__role'
              }
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  role: 'DOCTOR',
                }))
                setError('')
              }}
            >
              Doctor / professional
            </button>
          </div>

          {/* Full name */}
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

          {/* Doctor fields */}
          {form.role === 'DOCTOR' && (
            <>
              <label className="auth-form__field">
                <span>Profession type</span>

                <div className="auth-form__input">
                  <input
                    list="profession-types"
                    name="professionType"
                    value={form.professionType}
                    onChange={handleChange}
                    required
                  />

                  <datalist id="profession-types">
                    <option>Doctor</option>
                    <option>Speech Therapist</option>
                    <option>Occupational Therapist</option>
                    <option>Physiotherapist</option>
                    <option>Child Psychologist</option>
                    <option>Special Education Teacher</option>
                    <option>Behavioural Therapist</option>
                  </datalist>
                </div>
              </label>

              <TagInput
                label="Degrees / qualifications"
                kind="degrees"
                values={form.degrees}
                onChange={(degrees) =>
                  setForm((current) => ({
                    ...current,
                    degrees,
                  }))
                }
                placeholder="Type MBBS, FCPS..."
              />

              <TagInput
                label="Expertise / specialties"
                kind="specialties"
                values={form.specialties}
                onChange={(specialties) =>
                  setForm((current) => ({
                    ...current,
                    specialties,
                  }))
                }
                placeholder="Type autism, ADHD..."
              />

              {[
                [
                  'location',
                  'Practice location',
                  'City, institution, or chamber',
                ],
                [
                  'phone',
                  'Phone number',
                  'Optional contact number',
                ],
                [
                  'visitingDays',
                  'Available days',
                  'e.g. Saturday, Monday, Wednesday',
                ],
                [
                  'visitingHours',
                  'Available hours',
                  'e.g. 5pm - 9pm',
                ],
                [
                  'chamber',
                  'Hospital/school location',
                  'Where parents can visit you',
                ],
                [
                  'licenseAuthority',
                  'License authority',
                  'e.g. BM&DC or Other / Not applicable',
                ],
                [
                  'licenseNumber',
                  'License number',
                  'Optional unless required by your profession',
                ],
                [
                  'nidNumber',
                  'NID number',
                  'Required for verification',
                ],
              ].map(([name, label, placeholder]) => (
                <label
                  className="auth-form__field"
                  key={name}
                >
                  <span>{label}</span>

                  <div className="auth-form__input">
                    <input
                      type="text"
                      name={name}
                      placeholder={placeholder}
                      value={form[name]}
                      onChange={handleChange}
                    />
                  </div>
                </label>
              ))}

              <label className="auth-form__field">
                <span>Professional description</span>

                <textarea
                  name="description"
                  placeholder="Services, experience, and areas of care"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </label>

              {/* DAB membership */}
              <div className="auth-form__field">
                <span>DAB membership</span>

                <div className="auth-form__radio-group">
                  <label className="auth-form__radio">
                    <input
                      type="radio"
                      name="isDabMember"
                      checked={form.isDabMember === true}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          isDabMember: true,
                        }))
                      }
                    />

                    Yes, I am a member of Doctors Association of Bangladesh (DAB)
                  </label>

                  <label className="auth-form__radio">
                    <input
                      type="radio"
                      name="isDabMember"
                      checked={form.isDabMember === false}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          isDabMember: false,
                          dabSerial: '',
                        }))
                      }
                    />

                    No, I am not a DAB member
                  </label>
                </div>
              </div>

              {form.isDabMember && (
                <label className="auth-form__field">
                  <span>DAB serial number *</span>

                  <div className="auth-form__input">
                    <input
                      type="text"
                      name="dabSerial"
                      placeholder="e.g. DAB-123456"
                      value={form.dabSerial}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              )}
            </>
          )}

          {/* Email */}
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

          {/* Password */}
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

          {/* Terms */}
          <label className="auth-form__terms">
            <input type="checkbox" required />
            I agree to the Terms of Service and Privacy Policy
          </label>

          {/* Error */}
          {error && (
            <p
              className="auth-form__message auth-form__message--error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="auth-form__submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}