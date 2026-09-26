import { useEffect, useState } from 'react'
import { CalendarClock, Video, MapPin, Plus, Clock3 } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import { getAppointments } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './Appointments.css'

import { Link } from 'react-router-dom'

export default function Appointments() {
  const [tab, setTab] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    getAppointments()
      .then(({ appointments: rows }) => setAppointments(rows))
      .catch((loadError) => setError(loadError.message))
  }, [])

  const list = appointments
    .filter((appointment) => tab === 'upcoming' ? !['COMPLETED', 'CANCELLED'].includes(appointment.status) : ['COMPLETED', 'CANCELLED'].includes(appointment.status))
    .map((appointment) => {
      const date = new Date(appointment.scheduledAt)
      return {
        ...appointment,
        professional: appointment.professional.name,
        role: appointment.professional.specialty,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        child: user?.role === 'DOCTOR' ? appointment.parent.name : (appointment.notes?.split(' - ')[0] || 'Child profile'),
        mode: appointment.professional.chamber ? `Visit: ${appointment.professional.chamber}` : 'Contact provider',
      }
    })

  return (
    <div className="page appointments">
      <div className="container">
        <div className="appointments__header">
          <div>
            <h1>Appointments</h1>
            <p>Track, join, and book sessions for your children.</p>
          </div>
          <Link to="/professionals">
            <Button variant="primary" icon={Plus}>Book new appointment</Button>
          </Link>
        </div>
        {user?.role === 'DOCTOR' && <p className="appointments__role-note">You are viewing appointments assigned to your professional profile.</p>}
        {error && <p className="auth-form__message auth-form__message--error">{error}</p>}

        <div className="appointments__tabs">
          <button
            className={`appointments__tab ${tab === 'upcoming' ? 'appointments__tab--active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`appointments__tab ${tab === 'past' ? 'appointments__tab--active' : ''}`}
            onClick={() => setTab('past')}
          >
            Past
          </button>
        </div>

        <div className="appointments__list">
          {list.map((a) => (
            <div className="appointment-item" key={a.id}>
              <div className="appointment-item__date">
                <p className="appointment-item__day mono">{a.date.split(' ')[1].replace(',', '')}</p>
                <p className="appointment-item__month mono">{a.date.split(' ')[0]}</p>
              </div>

              <div className="appointment-item__divider" />

              <div className="appointment-item__body">
                <p className="appointment-item__title">{a.professional}</p>
                <p className="appointment-item__role">{a.role}</p>
                <div className="appointment-item__meta">
                  <Badge tone="brand">{a.child}</Badge>
                  <Badge tone="neutral">{a.status}</Badge>
                  <span className="appointment-item__time">
                    <Clock3 size={13} /> {a.time}
                  </span>
                  <span className="appointment-item__mode">
                    {a.mode === 'Video call' ? <Video size={13} /> : <MapPin size={13} />} {a.mode}
                  </span>
                </div>
              </div>

              {tab === 'upcoming' ? (
                <div className="appointment-item__actions">
                  <Button size="sm" variant="outline">Reschedule</Button>
                  <Button size="sm" variant="primary">
                    {a.mode === 'Video call' ? 'Join call' : 'Get directions'}
                  </Button>
                </div>
              ) : (
                <div className="appointment-item__actions">
                  <Button size="sm" variant="outline">Book again</Button>
                </div>
              )}
            </div>
          ))}

          {list.length === 0 && (
            <div className="appointments__empty">
              <CalendarClock size={30} />
              <p>No {tab} appointments yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
