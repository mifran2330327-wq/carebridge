import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Plus, CalendarClock, Sparkles, ArrowRight } from 'lucide-react'
import ChildCard from '../../components/ChildCard/ChildCard.jsx'
import Button from '../../components/Button/Button.jsx'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard.jsx'
import DoctorDashboard from '../DoctorDashboard/DoctorDashboard.jsx'
import { currentParent, upcomingAppointments, recommendations } from '../../data/mockData.js'
import { createChild, deleteChild, getChildren, getSession } from '../../lib/api.js'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const session = getSession()
  if (session?.user.role === 'DOCTOR') return <DoctorDashboard />
  const [profileChildren, setProfileChildren] = useState([])
  const [error, setError] = useState('')
  const [showChildForm, setShowChildForm] = useState(false)
  const [childForm, setChildForm] = useState({ name: '', dateOfBirth: '', supportNeeds: '', conditionDescription: '' })

  useEffect(() => {
    if (!session) {
      navigate('/login')
      return
    }
    getChildren()
      .then(({ children }) => setProfileChildren(children))
      .catch((loadError) => setError(loadError.message))
  }, [navigate, session?.token])

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
    try { await deleteChild(id); setProfileChildren((current) => current.filter((child) => child.id !== id)) } catch (submitError) { setError(submitError.message) }
  }

  const parent = session?.user || currentParent

  return (
    <div className="page dashboard">
      <div className="container">
        {/* ---------------- Welcome header ---------------- */}
        <div className="dashboard__header">
          <div className="dashboard__avatar mono">{parent.name[0]}</div>
          <div>
            <h1 className="dashboard__title">Welcome back, {parent.name.split(' ')[0]}</h1>
            <p className="dashboard__subtitle">Your CareBridge profile</p>
          </div>
        </div>

        {/* ---------------- Children profiles ---------------- */}
        <section className="dashboard__section">
          <div className="dashboard__section-head">
            <h2>Your children</h2>
            <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowChildForm((current) => !current)}>Add child</Button>
          </div>
          {showChildForm && <form className="child-form" onSubmit={handleAddChild}>
            <input placeholder="Child name" value={childForm.name} onChange={(event) => setChildForm({ ...childForm, name: event.target.value })} required />
            <input type="date" aria-label="Date of birth" value={childForm.dateOfBirth} onChange={(event) => setChildForm({ ...childForm, dateOfBirth: event.target.value })} />
            <input placeholder="Support needs or diagnosis" value={childForm.supportNeeds} onChange={(event) => setChildForm({ ...childForm, supportNeeds: event.target.value })} />
            <textarea placeholder="Describe your child's condition, strengths, and support needs" rows="3" value={childForm.conditionDescription} onChange={(event) => setChildForm({ ...childForm, conditionDescription: event.target.value })} />
            <Button type="submit" size="sm" variant="primary">Save child profile</Button>
          </form>}
          {error && <p role="alert">{error}</p>}
          <div className="dashboard__children-grid">
            {profileChildren.map((child) => (
              <ChildCard key={child.id} child={{
                ...child,
                age: child.dateOfBirth ? new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear() : '—',
                diagnosis: child.supportNeeds || 'Support needs not added yet',
                supportLevel: 'Profile active',
                notes: 'Your child profile is connected to the CareBridge database.',
              }} onDelete={handleDeleteChild} />
            ))}
          </div>
        </section>

        <div className="dashboard__split">
          {/* ---------------- Upcoming appointments ---------------- */}
          <section className="dashboard__section dashboard__section--half">
            <div className="dashboard__section-head">
              <h2>Upcoming appointments</h2>
              <Link to="/appointments" className="dashboard__see-all">See all</Link>
            </div>
            <div className="dashboard__appointments">
              {upcomingAppointments.map((a) => (
                <div className="appointment-row" key={a.id}>
                  <div className="appointment-row__icon">
                    <CalendarClock size={18} />
                  </div>
                  <div className="appointment-row__body">
                    <p className="appointment-row__title">{a.professional}</p>
                    <p className="appointment-row__meta">
                      {a.role} · {a.child} · {a.mode}
                    </p>
                  </div>
                  <div className="appointment-row__time">
                    <p className="mono">{a.date}</p>
                    <p className="mono">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------- AI Recommendations preview ---------------- */}
          <section className="dashboard__section dashboard__section--half">
            <div className="dashboard__section-head">
              <h2>
                <Sparkles size={17} className="dashboard__sparkle" /> Recommended for you
              </h2>
              <Link to="/recommendations" className="dashboard__see-all">See all</Link>
            </div>
            <div className="dashboard__recs">
              {recommendations.slice(0, 2).map((r) => (
                <RecommendationCard key={r.id} recommendation={r} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
