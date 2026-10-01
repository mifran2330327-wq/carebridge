import { useEffect, useMemo, useState } from 'react'
import { Phone, X, Loader2, CalendarCheck, ExternalLink, Calendar, Clock } from 'lucide-react'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import ProfessionalCard from '../../components/ProfessionalCard/ProfessionalCard.jsx'
import Button from '../../components/Button/Button.jsx'
import { getDirectory, createAppointment, getChildren, getSession } from '../../lib/api.js'
import { normalizeProfessional } from '../../lib/directory.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { generateTimeSlots, getAvailableDates, formatDateForInput } from '../../lib/timeSlots.js'
import './Professionals.css'

export default function Professionals() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState(null)
  const [professionals, setProfessionals] = useState([])
  const [bookingProvider, setBookingProvider] = useState(null)
  const [children, setChildren] = useState([])
  const [booking, setBooking] = useState({ childId: '', date: '', time: '', notes: '' })
  const [bookingMessage, setBookingMessage] = useState({ text: '', isError: false })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDateStr, setSelectedDateStr] = useState('')

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
    setSelectedDate('')
    setSelectedDateStr('')
    setAvailableSlots([])
    setSelectedSlot(null)
    setAvailableDates([])
    setBooking({ childId: '', date: '', time: '', notes: '' })
    if (user?.role === 'PARENT') {
      getChildren()
        .then(({ children: rows }) => setChildren(rows || []))
        .catch(() => setBookingMessage({ text: 'Unable to load children for booking.', isError: true }))
    }
    // Generate available dates for the next 30 days
    if (provider.visitingDays) {
      const dates = getAvailableDates(provider.visitingDays, 30)
      setAvailableDates(dates)
      if (dates.length > 0) {
        const firstDateStr = formatDateForInput(dates[0])
        setSelectedDate(firstDateStr)
        setSelectedDateStr(firstDateStr)
        // Generate slots for the first available date
        const slots = generateTimeSlots(provider.visitingDays, provider.visitingHours, dates[0])
        setAvailableSlots(slots)
      }
    } else if (provider.visitingHours) {
      // No visiting days but has hours - allow any date
      const today = new Date()
      const firstDateStr = formatDateForInput(today)
      setSelectedDate(firstDateStr)
      setSelectedDateStr(firstDateStr)
      const slots = generateTimeSlots(provider.visitingDays, provider.visitingHours, today)
      setAvailableSlots(slots)
    }
  }

  function handleDateChange(dateStr) {
    setSelectedDate(dateStr)
    setSelectedDateStr(dateStr)
    setSelectedSlot(null)
    setBooking(prev => ({ ...prev, date: dateStr, time: '' }))
    if (bookingProvider && bookingProvider.visitingDays && bookingProvider.visitingHours) {
      const slots = generateTimeSlots(bookingProvider.visitingDays, bookingProvider.visitingHours, new Date(dateStr))
      setAvailableSlots(slots)
    } else if (bookingProvider && bookingProvider.visitingHours) {
      const slots = generateTimeSlots(bookingProvider.visitingDays, bookingProvider.visitingHours, new Date(dateStr))
      setAvailableSlots(slots)
    } else {
      setAvailableSlots([])
    }
  }

  async function submitBooking(e) {
    e.preventDefault()
    if (!booking.childId) { setBookingMessage({ text: 'Please select a child.', isError: true }); return }
    if (!booking.date) { setBookingMessage({ text: 'Please choose a date.', isError: true }); return }
    if (!booking.time) { setBookingMessage({ text: 'Please choose a time slot.', isError: true }); return }
    setBookingLoading(true)
    setBookingMessage({ text: '', isError: false })
    try {
      // Combine date and time into scheduledAt
      const scheduledAt = new Date(`${booking.date}T${booking.time}:00`).toISOString()
      await createAppointment({ professionalId: bookingProvider.id, childId: booking.childId, scheduledAt, notes: booking.notes })
      setBookingMessage({ text: '✓ Appointment request sent! The doctor will confirm from their dashboard. You will get a notification.', isError: false })
      setBooking({ childId: '', date: '', time: '', notes: '' })
      setSelectedDate('')
      setSelectedDateStr('')
      setAvailableSlots([])
      setSelectedSlot(null)
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
        <div className="directory__hero">
  <div className="directory__hero-content">
    <span className="directory__eyebrow">CAREBRIDGE DIRECTORY</span>

    <h1>Find the right professional for your child</h1>

    <p>
      Browse specialists and doctors from the CareBridge network,
      then search by name, specialty, or location.
    </p>
  </div>

  {!loading && (
    <div className="directory__hero-stat">
      <strong>{professionals.length}</strong>
      <span>Professionals</span>
    </div>
  )}
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

                   {bookingProvider.visitingDays ? (
                     <label>
                       <span>Date *</span>
                       <select
                         value={selectedDate}
                         onChange={(e) => handleDateChange(e.target.value)}
                         required
                       >
                         <option value="">— Choose a date —</option>
                         {availableDates.map((d) => {
                           const dateStr = formatDateForInput(d)
                           return <option key={dateStr} value={dateStr}>{d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</option>
                         })}
                       </select>
                     </label>
                   ) : (
                     <label>
                       <span>Date *</span>
                       <input
                         type="date"
                         value={selectedDate}
                         min={new Date().toISOString().split('T')[0]}
                         onChange={(e) => handleDateChange(e.target.value)}
                         required
                       />
                     </label>
                   )}

                   {selectedDate && availableSlots.length > 0 && (
                     <label>
                       <span>Available time slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} *</span>
                       <div className="booking-modal__slots">
                         {availableSlots.map((slot) => {
                           const timeLabel = slot.label
                           const isSelected = selectedSlot === timeLabel
                           return (
                             <button
                               key={timeLabel}
                               type="button"
                               className={`booking-modal__slot ${isSelected ? 'booking-modal__slot--selected' : ''}`}
                               onClick={() => {
                                 setSelectedSlot(timeLabel)
                                 const hours = parseInt(timeLabel.match(/(\d+):/)[1], 10)
                                 const minsMatch = timeLabel.match(/:(\d{2})/)
                                 const minutes = minsMatch ? parseInt(minsMatch[1], 10) : 0
                                 const ampm = timeLabel.endsWith('PM') ? 12 : 0
                                 let hour24 = hours
                                 if (ampm === 12) {
                                   hour24 = hours === 12 ? 12 : hours + 12
                                 } else {
                                   hour24 = hours === 12 ? 0 : hours
                                 }
                                 const timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                                 setBooking((prev) => ({ ...prev, date: selectedDate, time: timeStr }))
                               }}
                             >
                               {timeLabel}
                             </button>
                           )
                         })}
                       </div>
                     </label>
                   )}

                   {selectedDate && availableSlots.length === 0 && (
                     <p className="booking-modal__no-slots">No available slots for this date. Please choose another date.</p>
                   )}

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
