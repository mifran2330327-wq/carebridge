import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  Phone,
  Building2,
  ShieldCheck,
} from 'lucide-react'

import Badge from '../../components/Badge/Badge.jsx'
import Button from '../../components/Button/Button.jsx'
import { getDirectory } from '../../lib/api.js'
import { normalizeProfessional } from '../../lib/directory.js'
import './ProfessionalProfile.css'

export default function ProfessionalProfile() {
  const { professionalId } = useParams()
  const navigate = useNavigate()

  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfessional() {
      try {
        setLoading(true)
        setError('')

        const data = await getDirectory()

        const professionals = Array.isArray(data)
          ? data
          : data?.professionals || data?.items || []

        const found = professionals.find(
          (item) => String(item.id) === String(professionalId)
        )

        if (!found) {
          setError('Professional not found.')
          return
        }

        // Use the SAME normalization used by /professionals
        const normalized = normalizeProfessional(found)

        setProfessional(normalized)
      } catch (err) {
        setError(err.message || 'Unable to load professional profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfessional()
  }, [professionalId])

  if (loading) {
    return (
      <main className="professional-profile-page">
        <div className="professional-profile-container">
          <div className="profile-loading">
            Loading professional profile...
          </div>
        </div>
      </main>
    )
  }

  if (error || !professional) {
    return (
      <main className="professional-profile-page">
        <div className="professional-profile-container">
          <div className="profile-error">
            <h2>Professional not found</h2>

            <p>
              {error || 'This professional profile is unavailable.'}
            </p>

            <Button
              variant="primary"
              onClick={() => navigate('/professionals')}
            >
              Back to professionals
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const {
    name,
    role,
    specialties = [],
    degrees = [],
    location,
    visitingDays,
    visitingHours,
    chamber,
    phone,
    verified,
    verificationStatus,
    isDabMember,
    dabSerial,
    ownerId,
  } = professional

  const isPlatformUser = Boolean(ownerId)

  const initials =
    name
      ?.split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('') || 'PR'

  const handleBooking = () => {
  navigate(`/professionals?book=${professional.id}`)
}

  const handleCall = () => {
    if (!phone) return

    window.location.href = `tel:${phone.replace(/\s+/g, '')}`
  }

  return (
    <main className="professional-profile-page">
      <div className="professional-profile-container">

        {/* Back */}
        <Link
          to="/professionals"
          className="profile-back-link"
        >
          <ArrowLeft size={16} />
          <span>Back to professionals</span>
        </Link>

        {/* Profile hero */}
        <section className="professional-profile-hero">

          <div className="profile-hero-main">

            <div className="profile-avatar mono">
              {initials}
            </div>

            <div className="profile-hero-content">

              <div className="profile-name-row">
                <h1>{name}</h1>

                {verified && (
                  <BadgeCheck
                    size={21}
                    className="profile-verified-icon"
                    aria-label="Verified professional"
                  />
                )}
              </div>

              <p className="profile-role">
                {role || 'Professional'}
              </p>

              <div className="profile-hero-meta">

                {location && (
                  <span>
                    <MapPin size={15} />
                    {location}
                  </span>
                )}

                {verified && (
                  <span className="profile-verified-label">
                    <ShieldCheck size={15} />
                    Verified professional
                  </span>
                )}

              </div>
            </div>
          </div>

          {/* Header action */}
          <div className="profile-hero-actions">

            {isPlatformUser ? (
              <Button
                variant="primary"
                onClick={handleBooking}
              >
                <CalendarDays size={16} />
                Book session
              </Button>
            ) : phone ? (
              <button
                type="button"
                className="profile-call-button"
                onClick={handleCall}
              >
                <Phone size={16} />
                <span>Call professional</span>
              </button>
            ) : null}

          </div>
        </section>

        {/* Main content */}
        <div className="professional-profile-grid">

          {/* LEFT COLUMN */}
          <div className="professional-profile-main">

            {/* Specialties */}
            {specialties.length > 0 && (
              <section className="profile-section-card">

                <div className="profile-section-heading">
                  <div>
                    <p className="profile-section-eyebrow">
                      Expertise
                    </p>

                    <h2>
                      Specialties & expertise
                    </h2>
                  </div>
                </div>

                <div className="profile-specialties">
                  {specialties.map((specialty) => (
                    <Badge
                      key={specialty}
                      tone="brand"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>

              </section>
            )}

            {/* Qualifications */}
            {degrees.length > 0 && (
              <section className="profile-section-card">

                <div className="profile-section-heading">
                  <div>
                    <p className="profile-section-eyebrow">
                      Education
                    </p>

                    <h2>
                      Qualifications
                    </h2>
                  </div>

                  <GraduationCap size={21} />
                </div>

                <div className="profile-qualification-list">

                  {degrees.map((degree) => (
                    <div
                      className="profile-qualification"
                      key={degree}
                    >
                      <div className="profile-qualification-icon">
                        <GraduationCap size={16} />
                      </div>

                      <span>{degree}</span>
                    </div>
                  ))}

                </div>
              </section>
            )}

            {/* Availability */}
            {(visitingDays || visitingHours) && (
              <section className="profile-section-card">

                <div className="profile-section-heading">
                  <div>
                    <p className="profile-section-eyebrow">
                      Schedule
                    </p>

                    <h2>
                      Availability
                    </h2>
                  </div>

                  <CalendarDays size={21} />
                </div>

                <div className="profile-availability-grid">

                  {visitingDays && (
                    <div className="profile-availability-item">

                      <div className="profile-info-icon">
                        <CalendarDays size={17} />
                      </div>

                      <div>
                        <span>Available days</span>
                        <strong>{visitingDays}</strong>
                      </div>

                    </div>
                  )}

                  {visitingHours && (
                    <div className="profile-availability-item">

                      <div className="profile-info-icon">
                        <Clock3 size={17} />
                      </div>

                      <div>
                        <span>Available hours</span>
                        <strong>{visitingHours}</strong>
                      </div>

                    </div>
                  )}

                </div>
              </section>
            )}

            {/* Empty state if no profile details */}
            {specialties.length === 0 &&
              degrees.length === 0 &&
              !visitingDays &&
              !visitingHours && (
                <section className="profile-section-card profile-empty-card">
                  <h2>Professional information</h2>
                  <p>
                    Additional professional information is not available yet.
                  </p>
                </section>
              )}

          </div>

          {/* RIGHT COLUMN */}
          <aside className="professional-profile-sidebar">

            {/* Practice information */}
            <section className="profile-sidebar-card">

              <div className="profile-sidebar-heading">
                <Building2 size={19} />
                <h2>Practice information</h2>
              </div>

              <div className="profile-info-list">

                {chamber && (
                  <div className="profile-info-row">
                    <Building2 size={17} />

                    <div>
                      <span>Chamber / institution</span>
                      <strong>{chamber}</strong>
                    </div>
                  </div>
                )}

                {location && (
                  <div className="profile-info-row">
                    <MapPin size={17} />

                    <div>
                      <span>Location</span>
                      <strong>{location}</strong>
                    </div>
                  </div>
                )}

                {phone && (
                  <div className="profile-info-row">
                    <Phone size={17} />

                    <div>
                      <span>Phone</span>
                      <strong>{phone}</strong>
                    </div>
                  </div>
                )}

              </div>
            </section>

            {/* Verification */}
            <section className="profile-sidebar-card">

              <div className="profile-sidebar-heading">
                <ShieldCheck size={19} />
                <h2>Verification</h2>
              </div>

              <div className="profile-verification">

                <div className="profile-verification-status">

                  {verified ? (
                    <CheckCircle2
                      size={18}
                      className="profile-status-icon profile-status-icon--verified"
                    />
                  ) : (
                    <ShieldCheck
                      size={18}
                      className="profile-status-icon"
                    />
                  )}

                  <div>
                    <strong>
                      {verified
                        ? 'Verified professional'
                        : 'Verification pending'}
                    </strong>

                    <p>
                      {verified
                        ? 'This professional has been verified by CareBridge.'
                        : verificationStatus
                          ? `Current status: ${verificationStatus}`
                          : 'Verification information is currently pending.'}
                    </p>
                  </div>

                </div>

                {isDabMember && (
                  <Badge tone="brand">
                    DAB Member
                    {dabSerial && ` · ${dabSerial}`}
                  </Badge>
                )}

              </div>
            </section>

            {/* Contact / booking CTA */}
            <section className="profile-cta-card">

              <div className="profile-cta-icon">
                {isPlatformUser ? (
                  <CalendarDays size={20} />
                ) : (
                  <Phone size={20} />
                )}
              </div>

              <div className="profile-cta-content">

                <h2>
                  {isPlatformUser
                    ? 'Ready to book?'
                    : 'Need to contact this professional?'}
                </h2>

                <p>
                  {isPlatformUser
                    ? 'Request an appointment through CareBridge.'
                    : 'Contact the professional directly using the phone number provided.'}
                </p>

              </div>

              {isPlatformUser ? (
                <Button
                  variant="primary"
                  onClick={handleBooking}
                >
                  <CalendarDays size={16} />
                  Book session
                </Button>
              ) : phone ? (
                <button
                  type="button"
                  className="profile-call-button profile-call-button--full"
                  onClick={handleCall}
                >
                  <Phone size={16} />
                  <span>Call professional</span>
                </button>
              ) : null}

            </section>

          </aside>
        </div>
      </div>
    </main>
  )
}