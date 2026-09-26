import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addCertificate,
  createResource,
  getAppointments,
  getMyResources,
  getSession,
  rescheduleAppointment,
  saveSession,
  updateAppointmentStatus,
  updateProfessional,
} from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../../components/Button/Button.jsx'
import './DoctorDashboard.css'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [currentProfessional, setCurrentProfessional] = useState(user?.professional)
  const professional = currentProfessional || user?.professional
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const [post, setPost] = useState({ type: 'VIDEO', title: '', summary: '', externalUrl: '', sourceName: '', specialties: [] })
  const [postMessage, setPostMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profile, setProfile] = useState({})
  const [certificate, setCertificate] = useState({ label: '', fileUrl: '' })
  const [certificateMessage, setCertificateMessage] = useState('')
  const [myResources, setMyResources] = useState([])
  const [rescheduleId, setRescheduleId] = useState(null)
  const [rescheduleTime, setRescheduleTime] = useState('')

  useEffect(() => {
    getAppointments()
      .then(({ appointments: rows }) => setAppointments(rows || []))
      .catch((loadError) => setError(loadError.message))
    getMyResources()
      .then(({ resources }) => setMyResources(resources || []))
      .catch(() => {})
    if (professional) {
      setProfile({
        name: user.name,
        professionType: professional.professionType || professional.providerType || 'Doctor',
        degrees: professional.qualification?.split(',').map((v) => v.trim()).filter(Boolean) || [],
        specialties: professional.specialty?.split(';').map((v) => v.trim()).filter(Boolean) || [],
        location: professional.location || '',
        chamber: professional.chamber || '',
        phone: professional.phone || '',
        visitingDays: professional.visitingDays || '',
        visitingHours: professional.visitingHours || '',
        licenseAuthority: professional.licenseAuthority || '',
        licenseNumber: professional.licenseNumber || '',
        nidNumber: professional.nidNumber || '',
        description: professional.description || '',
      })
    }
  }, [])

  async function submitPost(event) {
    event.preventDefault()
    setPostMessage('')
    try {
      const result = await createResource(post)
      setMyResources((current) => [result.resource, ...current])
      setPost({ type: 'VIDEO', title: '', summary: '', externalUrl: '', sourceName: '', specialties: [] })
      setPostMessage('Resource submitted successfully! It is pending admin review.')
    } catch (submitError) {
      setPostMessage(submitError.message)
    }
  }

  async function decideAppointment(id, status) {
    try {
      await updateAppointmentStatus(id, status)
      setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function handleReschedule(id) {
    if (!rescheduleTime) {
      setError('Please choose a new appointment time.')
      return
    }
    try {
      const { appointment } = await rescheduleAppointment(id, rescheduleTime)
      setAppointments((current) => current.map((item) => (item.id === id ? appointment : item)))
      setRescheduleId(null)
      setRescheduleTime('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    try {
      const res = await updateProfessional(profile)
      if (res?.professional) {
        setCurrentProfessional(res.professional)
      }
      const session = getSession()
      if (session?.user && profile.name) {
        saveSession({
          ...session,
          user: {
            ...session.user,
            name: profile.name.trim(),
            professional: res?.professional || session.user.professional,
          },
        })
      }
      setProfileMessage('Profile saved and submitted for review.')
      setEditing(false)
    } catch (saveError) {
      setProfileMessage(saveError.message)
    }
  }

  async function submitCertificate(event) {
    event.preventDefault()
    try {
      await addCertificate(certificate)
      setCertificate({ label: '', fileUrl: '' })
      setCertificateMessage('Certificate submitted for admin review.')
    } catch (submitError) {
      setCertificateMessage(submitError.message)
    }
  }

  return (
    <div className="page doctor-dashboard">
      <div className="container">
        <div className="doctor-dashboard__header">
          <div>
            <p className="mono">Professional Dashboard</p>
            <h1>Welcome, Dr. {user?.name}</h1>
            <p>Manage your appointments, change appointment times, submit medical resources, and update your profile.</p>
          </div>
          <Link to="/professionals">View Public Directory</Link>
        </div>

        {professional?.verificationStatus !== 'VERIFIED' && (
          <div className="doctor-dashboard__notice">
            Your profile is awaiting admin verification. You can still accept, decline, and reschedule patient appointments.
          </div>
        )}
        {professional?.verificationStatus === 'REJECTED' && (
          <div className="doctor-dashboard__notice">
            Admin note: {professional.verificationNote || 'Please update your verification documents.'}
          </div>
        )}

        {/* ---------------- APPOINTMENT REQUESTS & RESCHEDULE ---------------- */}
        <section className="doctor-dashboard__section">
          <h2>Patient Appointment Requests ({appointments.length})</h2>
          {error && <p className="auth-form__message auth-form__message--error" role="alert">{error}</p>}
          <div className="doctor-dashboard__appointments-list">
            {appointments.map((appointment) => (
              <article className="doctor-dashboard__appointment" key={appointment.id}>
                <div className="doctor-dashboard__appointment-info">
                  <strong>Patient / Child: {appointment.notes?.split(' - ')[0] || 'Child Profile'}</strong>
                  <p>Parent: {appointment.parent?.name} ({appointment.parent?.email})</p>
                  <p className="mono">Scheduled: {new Date(appointment.scheduledAt).toLocaleString()}</p>
                  {appointment.notes?.split(' - ')[1] && (
                    <p className="doctor-dashboard__appointment-notes">Note: {appointment.notes.split(' - ')[1]}</p>
                  )}
                </div>
                <div className="doctor-dashboard__appointment-ctrls">
                  <span className={`doctor-dashboard__status-badge doctor-dashboard__status-badge--${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </span>
                  <div className="doctor-dashboard__actions-row">
                    {appointment.status === 'REQUESTED' && (
                      <Button size="sm" variant="primary" onClick={() => decideAppointment(appointment.id, 'CONFIRMED')}>
                        Accept
                      </Button>
                    )}
                    {(appointment.status === 'REQUESTED' || appointment.status === 'CONFIRMED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRescheduleId(rescheduleId === appointment.id ? null : appointment.id)}
                      >
                        {rescheduleId === appointment.id ? 'Cancel' : 'Change Time'}
                      </Button>
                    )}
                    {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                      <Button size="sm" variant="ghost" onClick={() => decideAppointment(appointment.id, 'CANCELLED')}>
                        Decline
                      </Button>
                    )}
                  </div>
                </div>

                {rescheduleId === appointment.id && (
                  <div className="doctor-dashboard__reschedule-form">
                    <label>
                      <span>Propose New Time for this Appointment:</span>
                      <input
                        type="datetime-local"
                        value={rescheduleTime}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        required
                      />
                    </label>
                    <div className="doctor-dashboard__reschedule-actions">
                      <Button size="sm" variant="primary" onClick={() => handleReschedule(appointment.id)}>
                        Save &amp; Notify Parent
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRescheduleId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
            {!appointments.length && !error && <p>No appointment requests yet.</p>}
          </div>
        </section>

        {/* ---------------- SUBMIT RESOURCES ---------------- */}
        <section className="doctor-dashboard__section">
          <h2>Submit Medical Resource (Videos &amp; Articles)</h2>
          <p>Doctors can publish educational videos, case studies, and guides. Submissions will be reviewed by admin.</p>
          <form className="doctor-dashboard__post" onSubmit={submitPost}>
            <div className="doctor-dashboard__form-grid">
              <label>
                <span>Resource Type</span>
                <select value={post.type} onChange={(event) => setPost({ ...post, type: event.target.value })}>
                  <option value="VIDEO">YouTube Video Guide</option>
                  <option value="ARTICLE">Article / Clinical Guide</option>
                  <option value="CASE_STUDY">Case Study</option>
                  <option value="GUIDE">General Guide</option>
                </select>
              </label>
              <label>
                <span>Title *</span>
                <input
                  placeholder="e.g. Recognizing Early Signs of Autism in Toddlers"
                  value={post.title}
                  onChange={(event) => setPost({ ...post, title: event.target.value })}
                  required
                />
              </label>
            </div>

            <label>
              <span>{post.type === 'VIDEO' ? 'YouTube Video URL *' : 'Article / Reference URL'}</span>
              <input
                type="url"
                placeholder={post.type === 'VIDEO' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                value={post.externalUrl}
                onChange={(event) => setPost({ ...post, externalUrl: event.target.value })}
                required={post.type === 'VIDEO'}
              />
            </label>

            <label>
              <span>Summary / Description {post.type === 'ARTICLE' ? '*' : '(optional)'}</span>
              <textarea
                placeholder="Key takeaways or summary for parents..."
                rows={4}
                value={post.summary}
                onChange={(event) => setPost({ ...post, summary: event.target.value })}
                required={post.type === 'ARTICLE'}
              />
            </label>

            <label>
              <span>Source / Institution Name</span>
              <input
                placeholder="e.g. BSMMU Dept of Pediatric Neurology"
                value={post.sourceName}
                onChange={(event) => setPost({ ...post, sourceName: event.target.value })}
              />
            </label>

            <Button type="submit" variant="primary">Submit Resource for Review</Button>
            {postMessage && <p role="status" className="doctor-dashboard__msg">{postMessage}</p>}
          </form>

          <h3>My Submitted Resources ({myResources.length})</h3>
          <div className="doctor-dashboard__resources-list">
            {myResources.map((resource) => (
              <div key={resource.id} className="doctor-dashboard__resource-item">
                <strong>{resource.title}</strong>
                <span>Type: {resource.type} · Status: {resource.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- PROFILE ---------------- */}
        <section className="doctor-dashboard__section">
          <div className="doctor-dashboard__section-head">
            <h2>Your Professional Profile</h2>
            <Button size="sm" variant="outline" onClick={() => setEditing((value) => !value)}>
              {editing ? 'Close editor' : 'Edit profile'}
            </Button>
          </div>
          {editing ? (
            <form className="doctor-dashboard__profile-form" onSubmit={saveProfile}>
              {['name', 'professionType', 'location', 'chamber', 'phone', 'visitingDays', 'visitingHours', 'licenseAuthority', 'licenseNumber', 'nidNumber'].map(
                (field) => (
                  <input
                    key={field}
                    placeholder={field}
                    value={profile[field] || ''}
                    onChange={(event) => setProfile({ ...profile, [field]: event.target.value })}
                    required={['name', 'professionType', 'location', 'visitingDays', 'visitingHours'].includes(field)}
                  />
                )
              )}
              <input
                placeholder="Degrees, comma separated"
                value={(profile.degrees || []).join(', ')}
                onChange={(event) =>
                  setProfile({ ...profile, degrees: event.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
                }
                required
              />
              <input
                placeholder="Specialties, semicolon separated"
                value={(profile.specialties || []).join('; ')}
                onChange={(event) =>
                  setProfile({ ...profile, specialties: event.target.value.split(';').map((v) => v.trim()).filter(Boolean) })
                }
                required
              />
              <textarea
                placeholder="Professional description"
                rows="3"
                value={profile.description || ''}
                onChange={(event) => setProfile({ ...profile, description: event.target.value })}
              />
              <Button type="submit" variant="primary">Save profile</Button>
              {profileMessage && <p role="status">{profileMessage}</p>}
            </form>
          ) : (
            <div className="doctor-dashboard__profile">
              <strong>{professional?.professionType || professional?.providerType || 'Professional'}</strong>
              <p>{professional?.specialty}</p>
              <p>{professional?.qualification}</p>
              <p>{professional?.location} {professional?.chamber && ` · ${professional.chamber}`}</p>
              <p>Visiting: {professional?.visitingDays} · {professional?.visitingHours}</p>
              <p>Contact: {professional?.phone || 'No phone added'}</p>
              <span className="doctor-dashboard__status">{professional?.verificationStatus || 'PENDING'}</span>
            </div>
          )}
        </section>

        {/* ---------------- CERTIFICATES ---------------- */}
        <section className="doctor-dashboard__section">
          <h2>Verification Certificates</h2>
          <form className="doctor-dashboard__post" onSubmit={submitCertificate}>
            <input
              placeholder="Certificate label, e.g. MBBS Certificate"
              value={certificate.label}
              onChange={(event) => setCertificate({ ...certificate, label: event.target.value })}
              required
            />
            <input
              placeholder="Private Supabase Storage path"
              value={certificate.fileUrl}
              onChange={(event) => setCertificate({ ...certificate, fileUrl: event.target.value })}
              required
            />
            <Button type="submit" variant="primary">Submit certificate</Button>
            {certificateMessage && <p role="status">{certificateMessage}</p>}
          </form>
        </section>
      </div>
    </div>
  )
}
