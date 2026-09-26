import { useEffect, useMemo, useState } from 'react'
import { Phone, X, Loader2, CalendarCheck, ExternalLink } from 'lucide-react'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import ProfessionalCard from '../../components/ProfessionalCard/ProfessionalCard.jsx'
import Button from '../../components/Button/Button.jsx'
import { getDirectory, createAppointment, getChildren, getSession } from '../../lib/api.js'
import { normalizeProfessional } from '../../lib/directory.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './Professionals.css'

export default function Professionals() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState(null)
  const [professionals, setProfessionals] = useState([])
  const [bookingProvider, setBookingProvider] = useState(null)
  const [children, setChildren] = useState([])
  const [booking, setBooking] = useState({ childId: '', scheduledAt: '', notes: '' })
  const [bookingMessage, setBookingMessage] = useState({ text: '', isError: false })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDirectory()
      .then(({ professionals: providerRows }) => {
        setProfessionals(Array.isArray(providerRows) ? providerRows.map(normalizeProfessional) : [])
      })
      .catch((err) => {
        setError('Unable to load professionals from database. Please check server connection.')
        setProfessionals([])
      })
      .finally(() => setLoading(false))
  }, [])

  function openBooking(provider) {
    // External doctors (no ownerId) — show call button only
    if (!provider.ownerId && provider.phone) {
      window.location.href = `tel:${provider.phone.replace(/\s+/g, '')}`
      return
    }
    setBookingProvider(provider)
    setBookingMessage({ text: '', isError: false })
    if (user?.role === 'PARENT') {
      getChildren()
        .then(({ children: rows }) => setChildren(rows || []))
        .catch(() => setBookingMessage({ text: 'Unable to load children for booking.', isError: true }))
    }
  }

  async function submitBooking(e) {
    e.preventDefault()
    if (!booking.childId) { setBookingMessage({ text: 'Please select a child.', isError: true }); return }
    if (!booking.scheduledAt) { setBookingMessage({ text: 'Please choose a date and time.', isError: true }); return }
    setBookingLoading(true)
    setBookingMessage({ text: '', isError: false })
    try {
      await createAppointment({ professionalId: bookingProvider.id, ...booking })
      setBookingMessage({ text: '✓ Appointment request sent! The doctor will confirm from their dashboard. You will get a notification.', isError: false })
      setBooking({ childId: '', scheduledAt: '', notes: '' })
      setTimeout(() => setBookingProvider(null), 3000)
    } catch (err) {
      setBookingMessage({ text: err.message, isError: true })
    } finally {
      setBookingLoading(false)
    }
  }

  const allSpecialties = [...new Set(professionals.flatMap((p) => p.specialties || []))]

  const filtered = useMemo(() => professionals.filter((p) => {
    const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.role && p.role.toLowerCase().includes(query.toLowerCase()))
    const matchS = !activeSpecialty || (p.specialties && p.specialties.includes(activeSpecialty))
    const matchL = !location || (p.location && p.location.toLowerCase().includes(location.trim().toLowerCase()))
    return matchQ && matchS && matchL
  }), [query, activeSpecialty, location, professionals])

  // Determine if a professional is platform-registered (has ownerId) vs external-only (no account, just phone)
  function isExternal(p) { return !p.ownerId }

  return (
    <div className="page directory">
      <div className="container">
        <div className="directory__header">
          <div>
            <h1>Therapist &amp; Professional Directory</h1>
            <p>Browse verified specialists and doctors from the CareBridge database.</p>
          </div>
        </div>

        <SearchBar value={query} onChange={setQuery} location={location} onLocationChange={setLocation} placeholder="Search by name or specialty..." />

        <div className="directory__chips">
          <button className={`directory__chip ${!activeSpecialty ? 'directory__chip--active' : ''}`} onClick={() => setActiveSpecialty(null)}>All</button>
          {allSpecialties.map((s) => (
            <button key={s} className={`directory__chip ${activeSpecialty === s ? 'directory__chip--active' : ''}`} onClick={() => setActiveSpecialty(s === activeSpecialty ? null : s)}>{s}</button>
          ))}
        </div>

        {error && <div className="directory__error" role="alert">{error}</div>}
        {loading && <div className="directory__loading"><Loader2 size={18} className="spin" /> Loading professionals from database...</div>}
        {!loading && <div className="directory__result-count mono">{filtered.length} professional{filtered.length !== 1 ? 's' : ''} found</div>}

        {/* Booking modal */}
        {bookingProvider && (
          <div className="booking-overlay">
            <div className="booking-modal">
              <div className="booking-modal__header">
                <div>
                  <h2>Book with {bookingProvider.name}</h2>
                  <p>{bookingProvider.role} {bookingProvider.visitingDays ? `· Available: ${bookingProvider.visitingDays}` : ''} {bookingProvider.visitingHours ? `${bookingProvider.visitingHours}` : ''}</p>
                  {bookingProvider.chamber && <p className="booking-modal__chamber">📍 {bookingProvider.chamber}</p>}
                </div>
                <button className="booking-modal__close" onClick={() => setBookingProvider(null)}><X size={20} /></button>
              </div>

              {user?.role !== 'PARENT' ? (
                <p className="booking-modal__note">Only registered parents can book appointments. <a href="/login">Log in as a parent</a> to continue.</p>
              ) : children.length === 0 ? (
                <p className="booking-modal__note">You need to add a child profile first. <a href="/dashboard">Go to Dashboard</a> to add one.</p>
              ) : (
                <form className="booking-modal__form" onSubmit={submitBooking}>
                  <label>
                    <span>Select child *</span>
                    <select value={booking.childId} onChange={(e) => setBooking({ ...booking, childId: e.target.value })} required>
                      <option value="">— Choose a child —</option>
                      {children.map((c) => <option key={c.id} value={c.id}>{c.name}{c.supportNeeds ? ` (${c.supportNeeds})` : ''}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Date &amp; time *</span>
                    <input
                      type="datetime-local"
                      value={booking.scheduledAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setBooking({ ...booking, scheduledAt: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    <span>Notes / visit preference (optional)</span>
                    <textarea
                      placeholder="Describe your concern or preferred visit type..."
                      rows={3}
                      value={booking.notes}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                    />
                  </label>
                  {bookingMessage.text && (
                    <p className={`booking-modal__message ${bookingMessage.isError ? 'booking-modal__message--error' : 'booking-modal__message--success'}`} role={bookingMessage.isError ? 'alert' : 'status'}>
                      {bookingMessage.text}
                    </p>
                  )}
                  <div className="booking-modal__actions">
                    <Button type="button" variant="ghost" onClick={() => setBookingProvider(null)}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={bookingLoading} icon={CalendarCheck}>
                      {bookingLoading ? <><Loader2 size={14} className="spin" /> Sending...</> : 'Request appointment'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="directory__grid">
          {filtered.map((p) => (
            <div key={p.id} className="professional-card-wrapper">
              <ProfessionalCard
                professional={{
                  ...p,
                  // External docs get onCall; platform docs get onBook
                  onBook: isExternal(p) ? null : openBooking,
                  onCall: isExternal(p) && p.phone ? (() => window.location.href = `tel:${p.phone.replace(/\s+/g, '')}`) : null,
                }}
              />
            </div>
          ))}
          {!loading && filtered.length === 0 && <p className="directory__empty">No professionals match your search.</p>}
        </div>
      </div>
    </div>
  )
}
