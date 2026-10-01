import { Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Plus,
  CalendarClock,
  Sparkles,
  Users,
  ArrowRight,
  HeartPulse,
  BookOpen,
  MapPin,
} from 'lucide-react'

import ChildCard from '../../components/ChildCard/ChildCard.jsx'
import Button from '../../components/Button/Button.jsx'
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard.jsx'
import DoctorDashboard from '../DoctorDashboard/DoctorDashboard.jsx'

import {
  createChild,
  deleteChild,
  getChildren,
  getAppointments,
  getDirectory,
  getResources,
} from '../../lib/api.js'

import { useAuth } from '../../context/AuthContext.jsx'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()

  const [profileChildren, setProfileChildren] = useState([])
  const [appointments, setAppointments] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [error, setError] = useState('')
  const [showChildForm, setShowChildForm] = useState(false)
  const [childForm, setChildForm] = useState({
    name: '',
    dateOfBirth: '',
    supportNeeds: '',
    conditionDescription: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'DOCTOR') return

    setLoading(true)

    Promise.all([
      getChildren().catch(() => ({ children: [] })),
      getAppointments().catch(() => ({ appointments: [] })),
      getDirectory().catch(() => ({
        professionals: [],
        institutions: [],
      })),
      getResources({ take: 10 }).catch(() => ({ resources: [] })),
    ])
      .then(
        ([
          { children },
          { appointments: appts },
          { professionals, institutions },
          { resources },
        ]) => {
          const loadedChildren = children || []
          setProfileChildren(loadedChildren)

          const formattedAppts = (appts || []).map((a) => {
            const date = new Date(a.scheduledAt)

            return {
              id: a.id,
              professional: a.professional?.name || 'Doctor',
              role: a.professional?.specialty || 'Specialist',
              child:
                a.notes?.split(' - ')[0] ||
                loadedChildren[0]?.name ||
                'Child',
              mode: a.professional?.chamber
                ? `Visit: ${a.professional.chamber}`
                : 'In-person / Chamber',
              date: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              time: date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              }),
              status: a.status,
            }
          })

          setAppointments(formattedAppts)

          const recs = []

          loadedChildren.forEach((child) => {
            const childCondition = `${child.supportNeeds || ''} ${
              child.conditionDescription || ''
            }`.toLowerCase()

            const keywords = childCondition
              .split(/[\s,;]+/)
              .filter((k) => k.length > 2)

            const matchedDocs = (professionals || []).filter((doc) => {
              const docInfo = `${doc.specialty || ''} ${
                doc.focus || ''
              } ${doc.name || ''}`.toLowerCase()

              return keywords.some((k) => docInfo.includes(k))
            })

            const primaryDoc =
              matchedDocs[0] || (professionals || [])[0]

            if (primaryDoc) {
              const isMatch = matchedDocs.length > 0

              recs.push({
                id: `rec-doc-${child.id}-${primaryDoc.id}`,
                forChild: child.name,
                type: isMatch
                  ? 'Recommended Doctor from Database (Matched)'
                  : 'Recommended Doctor from Database (General Specialist)',
                title: `${primaryDoc.name} — ${
                  primaryDoc.specialty || 'Specialist'
                }`,
                reason: isMatch
                  ? `Specialist matched from database for ${
                      child.supportNeeds || 'developmental condition'
                    } at ${
                      primaryDoc.chamber ||
                      primaryDoc.location ||
                      'Dhaka'
                    }.`
                  : `General pediatric specialist from database for ${
                      child.name
                    } at ${
                      primaryDoc.chamber ||
                      primaryDoc.location ||
                      'Dhaka'
                    }.`,
              })
            }

            const secondaryDoc =
              matchedDocs[1] ||
              (professionals || []).find(
                (p) => p.id !== primaryDoc?.id
              )

            if (
              secondaryDoc &&
              secondaryDoc.id !== primaryDoc?.id
            ) {
              recs.push({
                id: `rec-doc2-${child.id}-${secondaryDoc.id}`,
                forChild: child.name,
                type: 'Recommended Doctor from Database (General Specialist)',
                title: `${secondaryDoc.name} — ${
                  secondaryDoc.specialty || 'Specialist'
                }`,
                reason: `Specialist at ${
                  secondaryDoc.chamber ||
                  secondaryDoc.location ||
                  'Dhaka'
                } available for consultations.`,
              })
            }

            if (institutions && institutions.length > 0) {
              const inst = institutions[0]

              recs.push({
                id: `rec-inst-${child.id}`,
                forChild: child.name,
                type: 'School / Institution from Database',
                title: inst.name,
                reason: `Verified special care facility in ${
                  inst.district || inst.area || 'Dhaka'
                } suitable for ${child.name}.`,
              })
            }

            if (resources && resources.length > 0) {
              const res = resources[0]

              recs.push({
                id: `rec-res-${child.id}`,
                forChild: child.name,
                type:
                  res.type === 'VIDEO'
                    ? 'Database Video Guide'
                    : 'Database Educational Guide',
                title: res.title,
                reason:
                  'Curated educational resource from database for parent support.',
              })
            }
          })

          setRecommendations(recs)
        }
      )
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [user?.role])

  async function handleAddChild(event) {
    event.preventDefault()

    if (!childForm.name.trim()) return

    try {
      const { child } = await createChild(childForm)

      setProfileChildren((current) => [...current, child])

      setChildForm({
        name: '',
        dateOfBirth: '',
        supportNeeds: '',
        conditionDescription: '',
      })

      setShowChildForm(false)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  async function handleDeleteChild(id) {
    if (!window.confirm('Delete this child profile?')) return

    try {
      await deleteChild(id)

      setProfileChildren((current) =>
        current.filter((child) => child.id !== id)
      )
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const parentName = user?.name || 'Parent'
  const firstName = parentName.split(' ')[0]

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  if (user?.role === 'DOCTOR') {
    return <DoctorDashboard />
  }

  return (
    <div className="page dashboard">
      <div className="container">

        {/* =========================
            HERO / WELCOME
        ========================= */}

        <section className="dashboard__hero">
          <div className="dashboard__hero-content">
            <div className="dashboard__avatar mono">
              {parentName[0]?.toUpperCase()}
            </div>

            <div>
              <span className="dashboard__eyebrow">
                CareBridge Parent Portal
              </span>

              <h1 className="dashboard__title">
                Welcome back, {firstName}
              </h1>

              <p className="dashboard__subtitle">
                Manage your child&apos;s care, appointments and
                support resources from one place.
              </p>
            </div>
          </div>

          <div className="dashboard__hero-icon">
            <HeartPulse size={42} strokeWidth={1.5} />
          </div>
        </section>

        {/* =========================
            QUICK STATS
        ========================= */}

        <section className="dashboard__stats">
          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon">
              <Users size={19} />
            </div>

            <div>
              <span>Children</span>
              <strong>{profileChildren.length}</strong>
            </div>
          </div>

          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon">
              <CalendarClock size={19} />
            </div>

            <div>
              <span>Appointments</span>
              <strong>{appointments.length}</strong>
            </div>
          </div>

          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon">
              <Sparkles size={19} />
            </div>

            <div>
              <span>Recommendations</span>
              <strong>{recommendations.length}</strong>
            </div>
          </div>
        </section>

        {/* =========================
            CHILDREN
        ========================= */}

        <section className="dashboard__section">
          <div className="dashboard__section-head">
            <div>
              <span className="dashboard__section-kicker">
                Family profiles
              </span>

              <h2>Your children</h2>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={() =>
                setShowChildForm((current) => !current)
              }
            >
              {showChildForm ? 'Close' : 'Add child'}
            </Button>
          </div>

          {showChildForm && (
            <form
              className="child-form"
              onSubmit={handleAddChild}
            >
              <div className="child-form__heading">
                <div className="child-form__icon">
                  <Plus size={18} />
                </div>

                <div>
                  <h3>Add a child profile</h3>
                  <p>
                    Add basic information to personalize CareBridge.
                  </p>
                </div>
              </div>

              <div className="child-form__fields">
                <input
                  placeholder="Child name"
                  value={childForm.name}
                  onChange={(event) =>
                    setChildForm({
                      ...childForm,
                      name: event.target.value,
                    })
                  }
                  required
                />

                <input
                  type="date"
                  aria-label="Date of birth"
                  value={childForm.dateOfBirth}
                  onChange={(event) =>
                    setChildForm({
                      ...childForm,
                      dateOfBirth: event.target.value,
                    })
                  }
                />

                <input
                  placeholder="Support needs or diagnosis"
                  value={childForm.supportNeeds}
                  onChange={(event) =>
                    setChildForm({
                      ...childForm,
                      supportNeeds: event.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Describe your child's condition, strengths, and support needs"
                  rows="3"
                  value={childForm.conditionDescription}
                  onChange={(event) =>
                    setChildForm({
                      ...childForm,
                      conditionDescription: event.target.value,
                    })
                  }
                />
              </div>

              <div className="child-form__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowChildForm(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                >
                  Save child profile
                </Button>
              </div>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="auth-form__message auth-form__message--error"
            >
              {error}
            </p>
          )}

          {loading && (
            <div className="dashboard__loading">
              Loading your care dashboard...
            </div>
          )}

          <div className="dashboard__children-grid">
            {profileChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={{
                  ...child,
                  age: child.dateOfBirth
                    ? `${Math.max(
                        1,
                        new Date().getFullYear() -
                          new Date(
                            child.dateOfBirth
                          ).getFullYear()
                      )} yrs`
                    : '—',
                  diagnosis:
                    child.supportNeeds ||
                    'Support needs not added yet',
                  supportLevel: 'Profile Active',
                  notes:
                    child.conditionDescription ||
                    'No additional notes added yet.',
                }}
                onDelete={handleDeleteChild}
              />
            ))}

            {!loading &&
              profileChildren.length === 0 && (
                <div className="dashboard__empty-child">
                  <div className="dashboard__empty-child-icon">
                    <Users size={24} />
                  </div>

                  <h3>No child profiles yet</h3>

                  <p>
                    Add your first child profile to start
                    receiving personalized recommendations.
                  </p>

                  <Button
                    size="sm"
                    variant="primary"
                    icon={Plus}
                    onClick={() =>
                      setShowChildForm(true)
                    }
                  >
                    Add first child
                  </Button>
                </div>
              )}
          </div>
        </section>

        {/* =========================
            LOWER GRID
        ========================= */}

        <div className="dashboard__split">

          {/* APPOINTMENTS */}

          <section className="dashboard__section dashboard__section--half">
            <div className="dashboard__section-head">
              <div>
                <span className="dashboard__section-kicker">
                  Your schedule
                </span>

                <h2>Upcoming appointments</h2>
              </div>

              <Link
                to="/appointments"
                className="dashboard__see-all"
              >
                View all
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="dashboard__appointments">
              {appointments.slice(0, 3).map((a) => (
                <div
                  className="appointment-row"
                  key={a.id}
                >
                  <div className="appointment-row__date">
                    <span>
                      {a.date.split(' ')[0]}
                    </span>

                    <strong>
                      {a.date.split(' ')[1]?.replace(',', '')}
                    </strong>
                  </div>

                  <div className="appointment-row__body">
                    <p className="appointment-row__title">
                      {a.professional}
                    </p>

                    <p className="appointment-row__meta">
                      {a.role} · {a.child}
                    </p>

                    <span className="appointment-row__location">
                      <MapPin size={12} />
                      {a.mode}
                    </span>
                  </div>

                  <div className="appointment-row__side">
                    <span className="appointment-row__time">
                      {a.time}
                    </span>

                    <span
                      className={`appointment-row__status appointment-row__status--${String(
                        a.status || ''
                      ).toLowerCase()}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}

              {!loading && appointments.length === 0 && (
                <div className="dashboard__empty-note">
                  <div className="dashboard__empty-note-icon">
                    <CalendarClock size={22} />
                  </div>

                  <h3>No upcoming appointments</h3>

                  <p>
                    Find a specialist and book your first
                    CareBridge session.
                  </p>

                  <Link to="/professionals">
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      Find a specialist
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* RECOMMENDATIONS */}

          <section className="dashboard__section dashboard__section--half">
            <div className="dashboard__section-head">
              <div>
                <span className="dashboard__section-kicker">
                  Personalized support
                </span>

                <h2>
                  <Sparkles
                    size={17}
                    className="dashboard__sparkle"
                  />
                  Recommended for you
                </h2>
              </div>

              <Link
                to="/recommendations"
                className="dashboard__see-all"
              >
                View all
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="dashboard__recs">
              {recommendations
                .slice(0, 2)
                .map((r) => (
                  <RecommendationCard
                    key={r.id}
                    recommendation={r}
                  />
                ))}

              {!loading &&
                recommendations.length === 0 && (
                  <div className="dashboard__empty-note">
                    <div className="dashboard__empty-note-icon">
                      <BookOpen size={22} />
                    </div>

                    <h3>
                      Recommendations will appear here
                    </h3>

                    <p>
                      Add a child profile to receive
                      personalized care suggestions.
                    </p>
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}