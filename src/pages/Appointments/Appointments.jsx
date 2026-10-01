import { useEffect, useState } from 'react'
import {
  CalendarClock,
  Video,
  MapPin,
  Plus,
  Clock3,
  UserRound,
  CalendarDays,
  X,
  Loader2,
} from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import {
  getAppointments,
  rescheduleAppointment,
} from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './Appointments.css'
import { Link } from 'react-router-dom'

function toDateTimeLocal(value) {
  const date = new Date(value)

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)

  return localDate.toISOString().slice(0, 16)
}

export default function Appointments() {
  const [tab, setTab] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const { user } = useAuth()

  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [newDateTime, setNewDateTime] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')
  const [rescheduleSuccess, setRescheduleSuccess] = useState('')
  const [savingReschedule, setSavingReschedule] = useState(false)

  const loadAppointments = () => {
    getAppointments()
      .then(({ appointments: rows }) => setAppointments(rows))
      .catch((loadError) => setError(loadError.message))
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const openReschedule = (appointment) => {
    setRescheduleTarget(appointment)
    setNewDateTime(toDateTimeLocal(appointment.scheduledAt))
    setRescheduleError('')
    setRescheduleSuccess('')
  }

  const closeReschedule = () => {
    if (savingReschedule) return

    setRescheduleTarget(null)
    setNewDateTime('')
    setRescheduleError('')
    setRescheduleSuccess('')
  }

  const handleReschedule = async (event) => {
    event.preventDefault()

    if (!rescheduleTarget || !newDateTime) {
      setRescheduleError('Please select a new date and time.')
      return
    }

    const selectedDate = new Date(newDateTime)

    if (Number.isNaN(selectedDate.getTime())) {
      setRescheduleError('Please select a valid date and time.')
      return
    }

    if (selectedDate <= new Date()) {
      setRescheduleError('Please choose a future date and time.')
      return
    }

    setSavingReschedule(true)
    setRescheduleError('')
    setRescheduleSuccess('')

    try {
      await rescheduleAppointment(
        rescheduleTarget.id,
        selectedDate.toISOString(),
      )

      setRescheduleSuccess(
        'Reschedule request submitted successfully.',
      )

      await new Promise((resolve) => setTimeout(resolve, 700))

      await getAppointments().then(({ appointments: rows }) => {
        setAppointments(rows)
      })

      setTimeout(() => {
        closeReschedule()
      }, 900)
    } catch (err) {
      setRescheduleError(
        err.message || 'Unable to reschedule this appointment.',
      )
    } finally {
      setSavingReschedule(false)
    }
  }

  const handleDirections = (appointment) => {
    const professional = appointment.professional || {}

    const searchParts = [
      professional.chamber,
      professional.location,
      professional.name,
      'Bangladesh',
    ].filter(Boolean)

    const query = encodeURIComponent(searchParts.join(', '))

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const list = appointments
    .filter((appointment) =>
      tab === 'upcoming'
        ? !['COMPLETED', 'CANCELLED'].includes(appointment.status)
        : ['COMPLETED', 'CANCELLED'].includes(appointment.status),
    )
    .map((appointment) => {
      const date = new Date(appointment.scheduledAt)

      return {
        ...appointment,
        professional: appointment.professional.name,
        role: appointment.professional.specialty,
        day: date.toLocaleDateString('en-US', {
          day: 'numeric',
        }),
        month: date.toLocaleDateString('en-US', {
          month: 'short',
        }),
        fullDate: date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        child:
          user?.role === 'DOCTOR'
            ? appointment.parent.name
            : appointment.notes?.split(' - ')[0] || 'Child profile',
        mode: appointment.professional.chamber
          ? `Visit: ${appointment.professional.chamber}`
          : 'Contact provider',
      }
    })

  const getStatusTone = (status) => {
    if (status === 'CONFIRMED') return 'success'
    if (status === 'CANCELLED') return 'neutral'
    if (status === 'COMPLETED') return 'brand'
    return 'neutral'
  }

  return (
    <div className="page appointments">
      <div className="container">

        <section className="appointments__hero">
          <div className="appointments__hero-content">
            <div className="appointments__eyebrow">
              <CalendarDays size={15} />
              Care schedule
            </div>

            <h1>Appointments</h1>

            <p>
              Keep track of upcoming sessions, past visits, and your family&apos;s
              care schedule in one place.
            </p>
          </div>

          <Link to="/professionals" className="appointments__book-link">
            <Button variant="primary" icon={Plus}>
              Book new appointment
            </Button>
          </Link>
        </section>

        {user?.role === 'DOCTOR' && (
          <div className="appointments__role-note">
            <UserRound size={16} />
            <span>
              You are viewing appointments assigned to your professional profile.
            </span>
          </div>
        )}

        {error && (
          <div className="appointments__error" role="alert">
            {error}
          </div>
        )}

        <section className="appointments__toolbar">
          <div className="appointments__tabs">
            <button
              className={`appointments__tab ${
                tab === 'upcoming' ? 'appointments__tab--active' : ''
              }`}
              onClick={() => setTab('upcoming')}
              type="button"
            >
              Upcoming
            </button>

            <button
              className={`appointments__tab ${
                tab === 'past' ? 'appointments__tab--active' : ''
              }`}
              onClick={() => setTab('past')}
              type="button"
            >
              Past
            </button>
          </div>

          <span className="appointments__count mono">
            {list.length}{' '}
            {list.length === 1 ? 'appointment' : 'appointments'}
          </span>
        </section>

        <div className="appointments__list">
          {list.map((a) => (
            <article className="appointment-item" key={a.id}>

              <div className="appointment-item__date">
                <span className="appointment-item__month mono">
                  {a.month}
                </span>

                <span className="appointment-item__day mono">
                  {a.day}
                </span>

                <span className="appointment-item__year mono">
                  {new Date(a.scheduledAt).getFullYear()}
                </span>
              </div>

              <div className="appointment-item__divider" />

              <div className="appointment-item__body">

                <div className="appointment-item__heading">
                  <div>
                    <p className="appointment-item__title">
                      {a.professional}
                    </p>

                    <p className="appointment-item__role">
                      {a.role}
                    </p>
                  </div>

                  <Badge tone={getStatusTone(a.status)}>
                    {a.status}
                  </Badge>
                </div>

                <div className="appointment-item__details">
                  <span className="appointment-item__detail">
                    <Clock3 size={15} />
                    {a.time}
                  </span>

                  <span className="appointment-item__detail">
                    {a.mode === 'Video call' ? (
                      <Video size={15} />
                    ) : (
                      <MapPin size={15} />
                    )}
                    {a.mode}
                  </span>

                  <span className="appointment-item__detail">
                    <UserRound size={15} />
                    {a.child}
                  </span>
                </div>

                <p className="appointment-item__date-label">
                  {a.fullDate}
                </p>

              </div>

              <div className="appointment-item__actions">
                {tab === 'upcoming' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openReschedule(a)}
                    >
                      Reschedule
                    </Button>

                    {a.mode === 'Video call' ? (
                      <Button size="sm" variant="primary">
                        Join call
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleDirections(a)}
                      >
                        Get directions
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="sm" variant="outline">
                    Book again
                  </Button>
                )}
              </div>

            </article>
          ))}

          {list.length === 0 && (
            <div className="appointments__empty">
              <div className="appointments__empty-icon">
                <CalendarClock size={28} />
              </div>

              <h3>
                No {tab} appointments
              </h3>

              <p>
                {tab === 'upcoming'
                  ? 'Your upcoming sessions will appear here once you book an appointment.'
                  : 'Completed and cancelled appointments will appear here.'}
              </p>

              {tab === 'upcoming' && (
                <Link to="/professionals">
                  <Button variant="primary" icon={Plus}>
                    Find a professional
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

      </div>

      {rescheduleTarget && (
        <div
          className="reschedule-modal__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReschedule()
            }
          }}
        >
          <div
            className="reschedule-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
          >
            <div className="reschedule-modal__header">
              <div>
                <span className="reschedule-modal__eyebrow">
                  Appointment change
                </span>

                <h2 id="reschedule-title">
                  Reschedule appointment
                </h2>

                <p>
                  Choose a new date and time for your session with{' '}
                  <strong>
                    {rescheduleTarget.professional?.name}
                  </strong>.
                </p>
              </div>

              <button
                type="button"
                className="reschedule-modal__close"
                onClick={closeReschedule}
                aria-label="Close reschedule dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="reschedule-modal__form"
              onSubmit={handleReschedule}
            >
              <div className="reschedule-modal__field">
                <label htmlFor="reschedule-datetime">
                  New date & time
                </label>

                <input
                  id="reschedule-datetime"
                  type="datetime-local"
                  value={newDateTime}
                  min={toDateTimeLocal(new Date())}
                  onChange={(event) => setNewDateTime(event.target.value)}
                  required
                />

                <small>
                  The new time must fall within the professional&apos;s
                  available schedule.
                </small>
              </div>

              {rescheduleError && (
                <div className="reschedule-modal__message reschedule-modal__message--error">
                  {rescheduleError}
                </div>
              )}

              {rescheduleSuccess && (
                <div className="reschedule-modal__message reschedule-modal__message--success">
                  {rescheduleSuccess}
                </div>
              )}

              <div className="reschedule-modal__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={closeReschedule}
                  disabled={savingReschedule}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={savingReschedule}
                >
                  {savingReschedule ? (
                    <>
                      <Loader2 size={15} className="reschedule-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Confirm reschedule'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}