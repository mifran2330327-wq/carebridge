import { Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Plus, CalendarClock, Sparkles, Clock3, MapPin } from 'lucide-react'
import ChildCard from '../../components/ChildCard/ChildCard.jsx'
import Button from '../../components/Button/Button.jsx'
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard.jsx'
import DoctorDashboard from '../DoctorDashboard/DoctorDashboard.jsx'
import { createChild, deleteChild, getChildren, getAppointments, getDirectory, getResources } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()

  const [profileChildren, setProfileChildren] = useState([])
  const [appointments, setAppointments] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [error, setError] = useState('')
  const [showChildForm, setShowChildForm] = useState(false)
  const [childForm, setChildForm] = useState({ name: '', dateOfBirth: '', supportNeeds: '', conditionDescription: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'DOCTOR') return

    setLoading(true)
    Promise.all([
      getChildren().catch(() => ({ children: [] })),
      getAppointments().catch(() => ({ appointments: [] })),
      getDirectory().catch(() => ({ professionals: [], institutions: [] })),
      getResources({ take: 10 }).catch(() => ({ resources: [] })),
    ])
      .then(([{ children }, { appointments: appts }, { professionals, institutions }, { resources }]) => {
        const loadedChildren = children || []
        setProfileChildren(loadedChildren)

        const formattedAppts = (appts || []).map((a) => {
          const date = new Date(a.scheduledAt)
          return {
            id: a.id,
            professional: a.professional?.name || 'Doctor',
            role: a.professional?.specialty || 'Specialist',
            child: a.notes?.split(' - ')[0] || loadedChildren[0]?.name || 'Child',
            mode: a.professional?.chamber ? `Visit: ${a.professional.chamber}` : 'In-person / Chamber',
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            status: a.status,
          }
        })
        setAppointments(formattedAppts)

        // Generate personalized recommendations from database matching child's condition
        const recs = []
        loadedChildren.forEach((child) => {
          const childCondition = `${child.supportNeeds || ''} ${child.conditionDescription || ''}`.toLowerCase()
          const keywords = childCondition.split(/[\s,;]+/).filter((k) => k.length > 2)

          // Find doctors in database matching child's condition
          const matchedDocs = (professionals || []).filter((doc) => {
            const docInfo = `${doc.specialty || ''} ${doc.focus || ''} ${doc.name || ''}`.toLowerCase()
            return keywords.some((k) => docInfo.includes(k))
          })

          // 1. Matched doctor or General doctor from database
          const primaryDoc = matchedDocs[0] || (professionals || [])[0]
          if (primaryDoc) {
            const isMatch = matchedDocs.length > 0
            recs.push({
              id: `rec-doc-${child.id}-${primaryDoc.id}`,
              forChild: child.name,
              type: isMatch ? 'Recommended Doctor from Database (Matched)' : 'Recommended Doctor from Database (General Specialist)',
              title: `${primaryDoc.name} — ${primaryDoc.specialty || 'Specialist'}`,
              reason: isMatch
                ? `Specialist matched from database for ${child.supportNeeds || 'developmental condition'} at ${primaryDoc.chamber || primaryDoc.location || 'Dhaka'}.`
                : `General pediatric specialist from database for ${child.name} at ${primaryDoc.chamber || primaryDoc.location || 'Dhaka'}.`,
            })
          }

          // 2. Additional doctor recommendation if available
          const secondaryDoc = matchedDocs[1] || (professionals || []).find((p) => p.id !== primaryDoc?.id)
          if (secondaryDoc && secondaryDoc.id !== primaryDoc?.id) {
            recs.push({
              id: `rec-doc2-${child.id}-${secondaryDoc.id}`,
              forChild: child.name,
              type: 'Recommended Doctor from Database (General Specialist)',
              title: `${secondaryDoc.name} — ${secondaryDoc.specialty || 'Specialist'}`,
              reason: `Specialist at ${secondaryDoc.chamber || secondaryDoc.location || 'Dhaka'} available for consultations.`,
            })
          }

          // 3. Institution from database
          if (institutions && institutions.length > 0) {
            const inst = institutions[0]
            recs.push({
              id: `rec-inst-${child.id}`,
              forChild: child.name,
              type: 'School / Institution from Database',
              title: inst.name,
              reason: `Verified special care facility in ${inst.district || inst.area || 'Dhaka'} suitable for ${child.name}.`,
            })
          }

          // 4. Educational resource from database
          if (resources && resources.length > 0) {
            const res = resources[0]
            recs.push({
              id: `rec-res-${child.id}`,
              forChild: child.name,
              type: res.type === 'VIDEO' ? 'Database Video Guide' : 'Database Educational Guide',
              title: res.title,
              reason: `Curated educational resource from database for parent support.`,
            })
          }
        })
        setRecommendations(recs)
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleAddChild(event) {
    event.preventDefault()
    if (!childForm.name.trim()) return
    try {
      const { child } = await createChild(childForm)
      setProfileChildren((current) => [...current, child])
      setChildForm({ name: '', dateOfBirth: '', supportNeeds: '', conditionDescription: '' })
      setShowChildForm(false)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  async function handleDeleteChild(id) {
    if (!window.confirm('Delete this child profile?')) return
    try {
      await deleteChild(id)
      setProfileChildren((current) => current.filter((child) => child.id !== id))
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const parentName = user?.name || 'Parent'

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user?.role === 'DOCTOR') return <DoctorDashboard />

  return (
    <div className="page dashboard">
      <div className="container">
        {/* ---------------- Welcome header ---------------- */}
        <div className="dashboard__header">
          <div className="dashboard__avatar mono">{parentName[0]}</div>
          <div>
            <h1 className="dashboard__title">Welcome back, {parentName.split(' ')[0]}</h1>
            <p className="dashboard__subtitle">Connected to CareBridge Database · {user?.email}</p>
          </div>
        </div>

        {/* ---------------- Children profiles ---------------- */}
        <section className="dashboard__section">
          <div className="dashboard__section-head">
            <h2>Your children ({profileChildren.length})</h2>
            <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowChildForm((current) => !current)}>
              Add child
            </Button>
          </div>
          {showChildForm && (
            <form className="child-form" onSubmit={handleAddChild}>
              <input
                placeholder="Child name"
                value={childForm.name}
                onChange={(event) => setChildForm({ ...childForm, name: event.target.value })}
                required
              />
              <input
                type="date"
                aria-label="Date of birth"
                value={childForm.dateOfBirth}
                onChange={(event) => setChildForm({ ...childForm, dateOfBirth: event.target.value })}
              />
              <input
                placeholder="Support needs or diagnosis (e.g. Autism, ADHD)"
                value={childForm.supportNeeds}
                onChange={(event) => setChildForm({ ...childForm, supportNeeds: event.target.value })}
              />
              <textarea
                placeholder="Describe your child's condition, strengths, and support needs"
                rows="3"
                value={childForm.conditionDescription}
                onChange={(event) => setChildForm({ ...childForm, conditionDescription: event.target.value })}
              />
              <Button type="submit" size="sm" variant="primary">
                Save child profile
              </Button>
            </form>
          )}
          {error && <p role="alert" className="auth-form__message auth-form__message--error">{error}</p>}
          {loading && <p>Loading child profiles from database...</p>}
          <div className="dashboard__children-grid">
            {profileChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={{
                  ...child,
                  age: child.dateOfBirth
                    ? `${Math.max(1, new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear())} yrs`
                    : '—',
                  diagnosis: child.supportNeeds || 'Support needs not added yet',
                  supportLevel: 'Database Profile Active',
                  notes: child.conditionDescription || 'Stored securely in CareBridge database.',
                }}
                onDelete={handleDeleteChild}
              />
            ))}
            {!loading && profileChildren.length === 0 && (
              <p className="directory__empty">No children profiles registered yet. Click &quot;Add child&quot; above to add your first child.</p>
            )}
          </div>
        </section>

        <div className="dashboard__split">
          {/* ---------------- Upcoming appointments ---------------- */}
          <section className="dashboard__section dashboard__section--half">
            <div className="dashboard__section-head">
              <h2>Upcoming appointments ({appointments.length})</h2>
              <Link to="/appointments" className="dashboard__see-all">See all</Link>
            </div>
            <div className="dashboard__appointments">
              {appointments.slice(0, 3).map((a) => (
                <div className="appointment-row" key={a.id}>
                  <div className="appointment-row__icon">
                    <CalendarClock size={18} />
                  </div>
                  <div className="appointment-row__body">
                    <p className="appointment-row__title">{a.professional}</p>
                    <p className="appointment-row__meta">
                      {a.role} · {a.child} · {a.status}
                    </p>
                  </div>
                  <div className="appointment-row__time">
                    <p className="mono">{a.date}</p>
                    <p className="mono">{a.time}</p>
                  </div>
                </div>
              ))}
              {!loading && appointments.length === 0 && (
                <div className="dashboard__empty-note">
                  <p>No upcoming appointments found in database.</p>
                  <Link to="/professionals"><Button size="sm" variant="outline">Book an appointment</Button></Link>
                </div>
              )}
            </div>
          </section>

          {/* ---------------- Recommendations preview ---------------- */}
          <section className="dashboard__section dashboard__section--half">
            <div className="dashboard__section-head">
              <h2>
                <Sparkles size={17} className="dashboard__sparkle" /> Recommended for your children
              </h2>
              <Link to="/recommendations" className="dashboard__see-all">See all</Link>
            </div>
            <div className="dashboard__recs">
              {recommendations.slice(0, 2).map((r) => (
                <RecommendationCard key={r.id} recommendation={r} />
              ))}
              {!loading && recommendations.length === 0 && (
                <p className="dashboard__empty-note">Add a child profile above to receive database recommendations.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
