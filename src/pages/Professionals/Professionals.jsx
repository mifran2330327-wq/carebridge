import { useEffect, useMemo, useState } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import ProfessionalCard from '../../components/ProfessionalCard/ProfessionalCard.jsx'
import { professionals as fallbackProfessionals } from '../../data/mockData.js'
import { getDirectory } from '../../lib/api.js'
import { createAppointment, getChildren, getSession } from '../../lib/api.js'
import { normalizeProfessional } from '../../lib/directory.js'
import './Professionals.css'

// Specialty filter chips derived from the mock data itself.
export default function Professionals() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState(null)
  const [professionals, setProfessionals] = useState(fallbackProfessionals)
  const [bookingProvider, setBookingProvider] = useState(null)
  const [children, setChildren] = useState([])
  const [booking, setBooking] = useState({ childId: '', scheduledAt: '', notes: '' })
  const [bookingMessage, setBookingMessage] = useState('')

  useEffect(() => {
    getDirectory().then(({ professionals: providerRows }) => {
      if (providerRows.length) setProfessionals(providerRows.map(normalizeProfessional))
    }).catch(() => {})
  }, [])

  function openBooking(provider) {
    setBookingProvider(provider)
    setBookingMessage('')
    if (getSession()?.user.role === 'PARENT') getChildren().then(({ children: rows }) => setChildren(rows)).catch(() => {})
  }

  async function submitBooking(event) {
    event.preventDefault()
    try {
      await createAppointment({ professionalId: bookingProvider.id, ...booking })
      setBookingMessage('Appointment request sent. The professional can confirm it from their dashboard.')
      setBooking({ childId: '', scheduledAt: '', notes: '' })
    } catch (error) { setBookingMessage(error.message) }
  }

  const allSpecialties = [...new Set(professionals.flatMap((professional) => professional.specialties || []))]

  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.role.toLowerCase().includes(query.toLowerCase())
      const matchesSpecialty = !activeSpecialty || p.specialties.includes(activeSpecialty)
      const matchesLocation = !location || p.location.toLowerCase().includes(location.trim().toLowerCase())
      return matchesQuery && matchesSpecialty && matchesLocation
    })
  }, [query, activeSpecialty, location, professionals])

  return (
    <div className="page directory">
      <div className="container">
        <div className="directory__header">
          <div>
            <h1>Therapist & Professional Directory</h1>
            <p>Browse verified professionals by specialty, distance, and availability.</p>
          </div>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          location={location}
          onLocationChange={setLocation}
          placeholder="Search by name or specialty..."
        />

        <div className="directory__chips">
          <button
            className={`directory__chip ${!activeSpecialty ? 'directory__chip--active' : ''}`}
            onClick={() => setActiveSpecialty(null)}
          >
            All
          </button>
          {allSpecialties.map((s) => (
            <button
              key={s}
              className={`directory__chip ${activeSpecialty === s ? 'directory__chip--active' : ''}`}
              onClick={() => setActiveSpecialty(s === activeSpecialty ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="directory__result-count mono">
          {filtered.length} professional{filtered.length !== 1 ? 's' : ''} found
        </div>

        {bookingProvider && <form className="booking-panel" onSubmit={submitBooking}>
          <div><strong>Book with {bookingProvider.name}</strong><p>{bookingProvider.visitingDays || 'Check availability'} {bookingProvider.visitingHours || ''}</p></div>
          {getSession()?.user.role === 'PARENT' ? <>
            <select value={booking.childId} onChange={(event) => setBooking({ ...booking, childId: event.target.value })} required>
              <option value="">Select child</option>
              {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
            </select>
            <input type="datetime-local" value={booking.scheduledAt} onChange={(event) => setBooking({ ...booking, scheduledAt: event.target.value })} required />
            <input placeholder="Message or visit preference" value={booking.notes} onChange={(event) => setBooking({ ...booking, notes: event.target.value })} />
            <button type="submit">Request appointment</button>
          </> : <p>Log in as a parent to request an appointment.</p>}
          {bookingMessage && <p role="status">{bookingMessage}</p>}
        </form>}

        <div className="directory__grid">
            {filtered.map((p) => <ProfessionalCard key={p.id} professional={{ ...p, onBook: openBooking }} />)}
          {filtered.length === 0 && <p className="directory__empty">No professionals match your filters yet — try clearing them.</p>}
        </div>
      </div>
    </div>
  )
}
