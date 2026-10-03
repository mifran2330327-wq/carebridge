import { useEffect, useMemo, useState } from 'react'
import {
  X,
  Loader2,
  CalendarCheck,
} from 'lucide-react'

import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import ProfessionalCard from '../../components/ProfessionalCard/ProfessionalCard.jsx'
import Button from '../../components/Button/Button.jsx'

import {
  getDirectory,
  createAppointment,
  getChildren,
} from '../../lib/api.js'

import { normalizeProfessional } from '../../lib/directory.js'
import { useAuth } from '../../context/AuthContext.jsx'

import {
  generateTimeSlots,
  getAvailableDates,
  formatDateForInput,
} from '../../lib/timeSlots.js'

import './Professionals.css'


export default function Professionals() {
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState(null)

  const [professionals, setProfessionals] = useState([])

  const [bookingProvider, setBookingProvider] = useState(null)
  const [children, setChildren] = useState([])

  const [booking, setBooking] = useState({
    childId: '',
    date: '',
    time: '',
    notes: '',
  })

  const [bookingMessage, setBookingMessage] = useState({
    text: '',
    isError: false,
  })

  const [bookingLoading, setBookingLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableDates, setAvailableDates] = useState([])


  /* =========================================================
     LOAD PROFESSIONALS
     ========================================================= */

  useEffect(() => {
    let mounted = true

    async function loadProfessionals() {
      setLoading(true)
      setError(null)

      try {
        const { professionals: providerRows } = await getDirectory()

        if (!mounted) return

        const normalizedProfessionals = Array.isArray(providerRows)
          ? providerRows.map(normalizeProfessional)
          : []

        setProfessionals(normalizedProfessionals)

        /*
         * If profile page redirected here with:
         * /professionals?book=PROFESSIONAL_ID
         *
         * automatically open that professional's booking modal.
         */
        const params = new URLSearchParams(window.location.search)
        const bookId = params.get('book')

        if (bookId) {
          const providerToBook = normalizedProfessionals.find(
            (provider) =>
              String(provider.id) === String(bookId)
          )

          if (providerToBook) {
            openBooking(providerToBook)
          }

          // Clean ?book=... from browser URL
          window.history.replaceState(
            {},
            '',
            '/professionals'
          )
        }
      } catch (err) {
        if (!mounted) return

        console.error('Failed to load professionals:', err)

        setError(
          'Unable to load professionals from database. Please check server connection.'
        )

        setProfessionals([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProfessionals()

    return () => {
      mounted = false
    }
  }, [])


  /* =========================================================
     OPEN BOOKING MODAL
     ========================================================= */

  async function openBooking(provider) {
    if (!provider) return

    /*
     * External professional:
     * no CareBridge account, so booking is not available.
     */
    if (!provider.ownerId) {
      if (provider.phone) {
        window.location.href = `tel:${provider.phone.replace(/\s+/g, '')}`
      }

      return
    }

    setBookingProvider(provider)

    setBookingMessage({
      text: '',
      isError: false,
    })

    setSelectedSlot(null)
    setAvailableSlots([])
    setAvailableDates([])

    setBooking({
      childId: '',
      date: '',
      time: '',
      notes: '',
    })


    /* ---------------------------------------------------------
       Load children
       --------------------------------------------------------- */

    if (user?.role === 'PARENT') {
      try {
        const { children: rows } = await getChildren()

        setChildren(Array.isArray(rows) ? rows : [])
      } catch (err) {
        console.error('Failed to load children:', err)

        setChildren([])

        setBookingMessage({
          text: 'Unable to load children for booking.',
          isError: true,
        })
      }
    }


    /* ---------------------------------------------------------
       Generate available dates
       --------------------------------------------------------- */

    if (provider.visitingDays) {
      const dates = getAvailableDates(
        provider.visitingDays,
        30
      )

      setAvailableDates(dates)

      if (dates.length > 0) {
        const firstDate = dates[0]
        const firstDateStr =
          formatDateForInput(firstDate)

        setBooking((prev) => ({
          ...prev,
          date: firstDateStr,
        }))

        const slots = generateTimeSlots(
          provider.visitingDays,
          provider.visitingHours,
          firstDate
        )

        setAvailableSlots(slots)
      }
    } else if (provider.visitingHours) {
      /*
       * If no visiting days are provided,
       * allow booking from today.
       */
      const today = new Date()

      const todayStr =
        formatDateForInput(today)

      setBooking((prev) => ({
        ...prev,
        date: todayStr,
      }))

      const slots = generateTimeSlots(
        provider.visitingDays,
        provider.visitingHours,
        today
      )

      setAvailableSlots(slots)
    }
  }


  /* =========================================================
     CLOSE BOOKING MODAL
     ========================================================= */

  function closeBooking() {
    setBookingProvider(null)

    setBooking({
      childId: '',
      date: '',
      time: '',
      notes: '',
    })

    setBookingMessage({
      text: '',
      isError: false,
    })

    setAvailableSlots([])
    setSelectedSlot(null)
    setAvailableDates([])

    window.history.replaceState(
      {},
      '',
      '/professionals'
    )
  }


  /* =========================================================
     DATE CHANGE
     ========================================================= */

  function handleDateChange(dateStr) {
    if (!dateStr || !bookingProvider) return

    setSelectedSlot(null)

    setBooking((prev) => ({
      ...prev,
      date: dateStr,
      time: '',
    }))

    const selectedDate = new Date(
      `${dateStr}T12:00:00`
    )

    const slots = generateTimeSlots(
      bookingProvider.visitingDays,
      bookingProvider.visitingHours,
      selectedDate
    )

    setAvailableSlots(slots)
  }


  /* =========================================================
     TIME SLOT SELECT
     ========================================================= */

  function handleSlotSelect(slot) {
    if (!slot) return

    const timeLabel = slot.label

    /*
     * Convert:
     * 5:00 PM
     * 6:30 PM
     * 12:00 PM
     *
     * into:
     * 17:00
     * 18:30
     * 12:00
     */

    const match = timeLabel.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    )

    if (!match) {
      console.error(
        'Invalid time slot:',
        timeLabel
      )

      return
    }

    let hour = Number(match[1])
    const minutes = Number(match[2])
    const period = match[3].toUpperCase()

    if (period === 'PM' && hour !== 12) {
      hour += 12
    }

    if (period === 'AM' && hour === 12) {
      hour = 0
    }

    const timeStr =
      `${String(hour).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}`

    setSelectedSlot(timeLabel)

    setBooking((prev) => ({
      ...prev,
      date: prev.date,
      time: timeStr,
    }))
  }


  /* =========================================================
     SUBMIT BOOKING
     ========================================================= */

  async function submitBooking(e) {
    e.preventDefault()

    setBookingMessage({
      text: '',
      isError: false,
    })


    if (!bookingProvider?.id) {
      setBookingMessage({
        text: 'Unable to identify this professional. Please close and try again.',
        isError: true,
      })

      return
    }


    if (user?.role !== 'PARENT') {
      setBookingMessage({
        text: 'Only registered parents can book appointments.',
        isError: true,
      })

      return
    }


    if (!booking.childId) {
      setBookingMessage({
        text: 'Please select a child.',
        isError: true,
      })

      return
    }


    if (!booking.date) {
      setBookingMessage({
        text: 'Please choose a date.',
        isError: true,
      })

      return
    }


    if (!booking.time) {
      setBookingMessage({
        text: 'Please choose a time slot.',
        isError: true,
      })

      return
    }


    setBookingLoading(true)


    try {
      /*
       * Use local date + selected time.
       *
       * Example:
       * 2026-10-03 + 19:00
       *
       * The backend receives a valid ISO timestamp.
       */
      const scheduledAt = new Date(
        `${booking.date}T${booking.time}:00`
      ).toISOString()


      console.log('Creating appointment:', {
        professionalId: bookingProvider.id,
        childId: booking.childId,
        scheduledAt,
        notes: booking.notes,
      })


      await createAppointment({
        professionalId: bookingProvider.id,
        childId: booking.childId,
        scheduledAt,
        notes: booking.notes,
      })


      setBookingMessage({
        text:
          'Appointment request sent successfully. The doctor will confirm it from their dashboard.',
        isError: false,
      })


      setBooking({
        childId: '',
        date: '',
        time: '',
        notes: '',
      })

      setSelectedSlot(null)
      setAvailableSlots([])


      /*
       * Keep success message visible for 2.5 seconds,
       * then close modal.
       */
      setTimeout(() => {
        closeBooking()
      }, 2500)

    } catch (err) {
      console.error(
        'Appointment creation failed:',
        err
      )

      setBookingMessage({
        text:
          err?.message ||
          'Unable to request appointment. Please try again.',
        isError: true,
      })
    } finally {
      setBookingLoading(false)
    }
  }


  /* =========================================================
     SPECIALTIES
     ========================================================= */

  const allSpecialties = [
    ...new Set(
      professionals.flatMap(
        (professional) =>
          professional.specialties || []
      )
    ),
  ]


  /* =========================================================
     FILTER
     ========================================================= */

  const filtered = useMemo(
    () =>
      professionals.filter((professional) => {
        const searchText =
          query.trim().toLowerCase()

        const locationText =
          location.trim().toLowerCase()

        const matchQ =
          !searchText ||
          professional.name
            ?.toLowerCase()
            .includes(searchText) ||
          professional.role
            ?.toLowerCase()
            .includes(searchText) ||
          professional.specialties?.some(
            (specialty) =>
              specialty
                .toLowerCase()
                .includes(searchText)
          )

        const matchS =
          !activeSpecialty ||
          professional.specialties?.includes(
            activeSpecialty
          )

        const matchL =
          !locationText ||
          professional.location
            ?.toLowerCase()
            .includes(locationText)

        return matchQ && matchS && matchL
      }),
    [
      query,
      activeSpecialty,
      location,
      professionals,
    ]
  )


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page directory">
      <div className="container">

        {/* =====================================================
            HERO
            ===================================================== */}

        <div className="directory__hero">

          <div className="directory__hero-content">

            <span className="directory__eyebrow">
              CAREBRIDGE DIRECTORY
            </span>

            <h1>
              Find the right professional for your child
            </h1>

            <p>
              Browse specialists and doctors from the
              CareBridge network, then search by name,
              specialty, or location.
            </p>

          </div>

          {!loading && (
            <div className="directory__hero-stat">
              <strong>
                {professionals.length}
              </strong>

              <span>
                Professionals
              </span>
            </div>
          )}

        </div>


        {/* =====================================================
            SEARCH
            ===================================================== */}

        <SearchBar
          value={query}
          onChange={setQuery}
          location={location}
          onLocationChange={setLocation}
          placeholder="Search by name or specialty..."
        />


        {/* =====================================================
            SPECIALTY FILTERS
            ===================================================== */}

        <div className="directory__chips">

          <button
            className={`directory__chip ${
              !activeSpecialty
                ? 'directory__chip--active'
                : ''
            }`}
            onClick={() =>
              setActiveSpecialty(null)
            }
          >
            All
          </button>

          {allSpecialties.map(
            (specialty) => (
              <button
                key={specialty}
                className={`directory__chip ${
                  activeSpecialty === specialty
                    ? 'directory__chip--active'
                    : ''
                }`}
                onClick={() =>
                  setActiveSpecialty(
                    specialty === activeSpecialty
                      ? null
                      : specialty
                  )
                }
              >
                {specialty}
              </button>
            )
          )}

        </div>


        {/* =====================================================
            ERROR / LOADING
            ===================================================== */}

        {error && (
          <div
            className="directory__error"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="directory__loading">
            <Loader2
              size={18}
              className="spin"
            />

            Loading professionals from database...
          </div>
        )}

        {!loading && (
          <div className="directory__result-count mono">
            {filtered.length}{' '}
            professional
            {filtered.length !== 1
              ? 's'
              : ''}{' '}
            found
          </div>
        )}


        {/* =====================================================
            BOOKING MODAL
            ===================================================== */}

        {bookingProvider && (
          <div
            className="booking-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
          >

            <div className="booking-modal">

              {/* Header */}

              <div className="booking-modal__header">

                <div>

                  <h2 id="booking-modal-title">
                    Book with{' '}
                    {bookingProvider.name}
                  </h2>

                  <p>
                    {bookingProvider.role}

                    {bookingProvider.visitingDays
                      ? ` · Available: ${bookingProvider.visitingDays}`
                      : ''}

                    {bookingProvider.visitingHours
                      ? ` · ${bookingProvider.visitingHours}`
                      : ''}
                  </p>

                  {bookingProvider.chamber && (
                    <p className="booking-modal__chamber">
                      📍{' '}
                      {bookingProvider.chamber}
                    </p>
                  )}

                </div>


                <button
                  type="button"
                  className="booking-modal__close"
                  onClick={closeBooking}
                  aria-label="Close booking modal"
                >
                  <X size={20} />
                </button>

              </div>


              {/* =================================================
                  NOT A PARENT
                  ================================================= */}

              {user?.role !== 'PARENT' ? (

                <p className="booking-modal__note">
                  Only registered parents can book
                  appointments.{' '}

                  <a href="/login">
                    Log in as a parent
                  </a>{' '}
                  to continue.
                </p>

              ) : children.length === 0 ? (

                /* =================================================
                   NO CHILD
                   ================================================= */

                <p className="booking-modal__note">
                  You need to add a child profile
                  first.{' '}

                  <a href="/dashboard">
                    Go to Dashboard
                  </a>{' '}
                  to add one.
                </p>

              ) : (

                /* =================================================
                   BOOKING FORM
                   ================================================= */

                <form
                  className="booking-modal__form"
                  onSubmit={submitBooking}
                >

                  {/* CHILD */}

                  <label>
                    <span>
                      Select child *
                    </span>

                    <select
                      value={booking.childId}
                      onChange={(e) =>
                        setBooking(
                          (prev) => ({
                            ...prev,
                            childId:
                              e.target.value,
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        — Choose a child —
                      </option>

                      {children.map(
                        (child) => (
                          <option
                            key={child.id}
                            value={child.id}
                          >
                            {child.name}

                            {child.supportNeeds
                              ? ` (${child.supportNeeds})`
                              : ''}
                          </option>
                        )
                      )}
                    </select>
                  </label>


                  {/* DATE */}

                  {bookingProvider.visitingDays ? (

                    <label>
                      <span>
                        Date *
                      </span>

                      <select
                        value={booking.date}
                        onChange={(e) =>
                          handleDateChange(
                            e.target.value
                          )
                        }
                        required
                      >

                        <option value="">
                          — Choose a date —
                        </option>

                        {availableDates.map(
                          (date) => {
                            const dateStr =
                              formatDateForInput(
                                date
                              )

                            return (
                              <option
                                key={dateStr}
                                value={dateStr}
                              >
                                {date.toLocaleDateString(
                                  'en-US',
                                  {
                                    weekday:
                                      'short',
                                    year:
                                      'numeric',
                                    month:
                                      'short',
                                    day:
                                      'numeric',
                                  }
                                )}
                              </option>
                            )
                          }
                        )}

                      </select>
                    </label>

                  ) : (

                    <label>
                      <span>
                        Date *
                      </span>

                      <input
                        type="date"
                        value={booking.date}
                        min={
                          new Date()
                            .toISOString()
                            .split('T')[0]
                        }
                        onChange={(e) =>
                          handleDateChange(
                            e.target.value
                          )
                        }
                        required
                      />

                    </label>

                  )}


                  {/* TIME SLOTS */}

                  {booking.date &&
                    availableSlots.length > 0 && (

                    <label>

                      <span>
                        Available time slots for{' '}

                        {new Date(
                          `${booking.date}T12:00:00`
                        ).toLocaleDateString(
                          'en-US',
                          {
                            weekday:
                              'short',
                            year:
                              'numeric',
                            month:
                              'short',
                            day:
                              'numeric',
                          }
                        )}{' '}
                        *
                      </span>


                      <div className="booking-modal__slots">

                        {availableSlots.map(
                          (slot) => {

                            const isSelected =
                              selectedSlot ===
                              slot.label

                            return (
                              <button
                                key={slot.label}
                                type="button"
                                className={`booking-modal__slot ${
                                  isSelected
                                    ? 'booking-modal__slot--selected'
                                    : ''
                                }`}
                                onClick={() =>
                                  handleSlotSelect(
                                    slot
                                  )
                                }
                              >
                                {slot.label}
                              </button>
                            )
                          }
                        )}

                      </div>

                    </label>
                  )}


                  {/* NO SLOT */}

                  {booking.date &&
                    availableSlots.length === 0 && (

                    <p className="booking-modal__no-slots">
                      No available slots for this
                      date. Please choose another
                      date.
                    </p>
                  )}


                  {/* NOTES */}

                  <label>

                    <span>
                      Notes / visit preference
                      (optional)
                    </span>

                    <textarea
                      placeholder="Describe your concern or preferred visit type..."
                      rows={3}
                      value={booking.notes}
                      onChange={(e) =>
                        setBooking(
                          (prev) => ({
                            ...prev,
                            notes:
                              e.target.value,
                          })
                        )
                      }
                    />

                  </label>


                  {/* MESSAGE */}

                  {bookingMessage.text && (
                    <p
                      className={`booking-modal__message ${
                        bookingMessage.isError
                          ? 'booking-modal__message--error'
                          : 'booking-modal__message--success'
                      }`}
                      role={
                        bookingMessage.isError
                          ? 'alert'
                          : 'status'
                      }
                    >
                      {bookingMessage.text}
                    </p>
                  )}


                  {/* ACTIONS */}

                  <div className="booking-modal__actions">

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeBooking}
                      disabled={bookingLoading}
                    >
                      Cancel
                    </Button>


                    <Button
                      type="submit"
                      variant="primary"
                      disabled={
                        bookingLoading ||
                        !booking.childId ||
                        !booking.date ||
                        !booking.time
                      }
                      icon={CalendarCheck}
                    >
                      {bookingLoading ? (
                        <>
                          <Loader2
                            size={14}
                            className="spin"
                          />

                          Sending...
                        </>
                      ) : (
                        'Request appointment'
                      )}
                    </Button>

                  </div>

                </form>
              )}

            </div>
          </div>
        )}


        {/* =====================================================
            PROFESSIONAL GRID
            ===================================================== */}

        <div className="directory__grid">

          {filtered.map(
            (professional) => (
              <div
                key={professional.id}
                className="professional-card-wrapper"
              >

                <ProfessionalCard
                  professional={{
                    ...professional,

                    onBook:
                      isExternal(
                        professional
                      )
                        ? null
                        : openBooking,
                  }}
                />

              </div>
            )
          )}


          {!loading &&
            filtered.length === 0 && (
              <p className="directory__empty">
                No professionals match your
                search.
              </p>
            )}

        </div>

      </div>
    </div>
  )
}


/* =========================================================
   EXTERNAL PROFESSIONAL CHECK
   ========================================================= */

function isExternal(professional) {
  return !professional.ownerId
}