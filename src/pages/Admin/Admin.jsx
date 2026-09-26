import { useEffect, useState } from 'react'
import { Check, X, Ban, Trash2, Plus, PlusCircle, Loader2, ExternalLink, Link2, Youtube, FileText } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import {
  banUser, createAdminResource, createInstitution,
  deleteInstitution, deleteUser, getAdminReports,
  getAdminResources, getAdminUsers, getDirectory,
  getPendingDoctors, resolveAdminReport, updateAdminResource,
  verifyDoctor, getLookups, getResources, deleteAdminResource,
  getCommunityPosts, deleteCommunityPost,
} from '../../lib/api.js'
import './Admin.css'

const EMPTY_INSTITUTION = { name: '', type: 'SCHOOL', ownership: 'GOVERNMENT', address: '', district: '', website: '', latitude: '', longitude: '' }
const EMPTY_RESOURCE = { title: '', summary: '', type: 'VIDEO', externalUrl: '', sourceName: '', featured: false }

export default function Admin() {
  const [activeTab, setActiveTab] = useState('doctors')
  const [message, setMessage] = useState({ text: '', isError: false })
  const [loading, setLoading] = useState(true)

  // Data
  const [doctors, setDoctors] = useState([])
  const [users, setUsers] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [resources, setResources] = useState([])
  const [publishedResources, setPublishedResources] = useState([])
  const [communityPosts, setCommunityPosts] = useState([])
  const [reports, setReports] = useState([])
  const [specialties, setSpecialties] = useState([])

  // Forms
  const [showInstForm, setShowInstForm] = useState(false)
  const [instForm, setInstForm] = useState(EMPTY_INSTITUTION)
  const [showResForm, setShowResForm] = useState(false)
  const [resForm, setResForm] = useState(EMPTY_RESOURCE)
  const [submitting, setSubmitting] = useState(false)

  function notify(text, isError = false) {
    setMessage({ text, isError })
    setTimeout(() => setMessage({ text: '', isError: false }), 4000)
  }

  async function load() {
    setLoading(true)
    try {
      const [pending, allUsers, directory, pendingResources, pendingReports, lookups, publishedRes, postsData] = await Promise.all([
        getPendingDoctors().catch(() => ({ doctors: [] })),
        getAdminUsers().catch(() => ({ users: [] })),
        getDirectory().catch(() => ({ professionals: [], institutions: [] })),
        getAdminResources().catch(() => ({ resources: [] })),
        getAdminReports().catch(() => ({ reports: [] })),
        getLookups().catch(() => ({ specialties: [] })),
        getResources({ take: 50 }).catch(() => ({ resources: [] })),
        getCommunityPosts({ take: 50 }).catch(() => ({ posts: [] })),
      ])
      setDoctors(pending.doctors || [])
      setUsers(allUsers.users || [])
      setInstitutions(directory.institutions || [])
      setResources(pendingResources.resources || [])
      setReports(pendingReports.reports || [])
      setSpecialties(lookups.specialties || [])
      setPublishedResources(publishedRes.resources || [])
      setCommunityPosts(postsData.posts || [])
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDeletePublishedResource(id, title) {
    if (!window.confirm(`Delete resource "${title}"?`)) return
    try {
      await deleteAdminResource(id)
      notify('Resource deleted from database.')
      load()
    } catch (err) {
      notify(err.message, true)
    }
  }

  async function handleDeletePost(id, title) {
    if (!window.confirm(`Delete community post "${title}"?`)) return
    try {
      await deleteCommunityPost(id)
      notify('Community post deleted.')
      load()
    } catch (err) {
      notify(err.message, true)
    }
  }

  // Doctor actions
  async function decide(id, status) {
    const note = status === 'REJECTED' ? window.prompt('Reason for rejection (optional)') : undefined
    try {
      await verifyDoctor(id, { status, note: note?.trim() || undefined })
      notify(`Doctor ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully.`)
      load()
    } catch (err) { notify(err.message, true) }
  }

  // User actions
  async function remove(id, name) {
    if (!window.confirm(`Delete ${name} permanently? This cannot be undone.`)) return
    try { await deleteUser(id); notify('User deleted.'); load() } catch (err) { notify(err.message, true) }
  }
  async function toggleBan(u) {
    try { await banUser(u.id, !u.isBanned); notify(u.isBanned ? 'User unbanned.' : 'User banned.'); load() }
    catch (err) { notify(err.message, true) }
  }

  // Institution actions
  async function handleAddInstitution(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createInstitution({
        ...instForm,
        latitude: instForm.latitude ? parseFloat(instForm.latitude) : undefined,
        longitude: instForm.longitude ? parseFloat(instForm.longitude) : undefined,
      })
      notify('Institution added to database.')
      setInstForm(EMPTY_INSTITUTION)
      setShowInstForm(false)
      load()
    } catch (err) { notify(err.message, true) }
    finally { setSubmitting(false) }
  }
  async function handleDeleteInstitution(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return
    try { await deleteInstitution(id); notify('Institution deleted.'); load() }
    catch (err) { notify(err.message, true) }
  }

  // Resource actions
  async function handleAddResource(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createAdminResource(resForm)
      notify('Resource published to database.')
      setResForm(EMPTY_RESOURCE)
      setShowResForm(false)
      load()
    } catch (err) { notify(err.message, true) }
    finally { setSubmitting(false) }
  }
  async function reviewResource(id, status) {
    try { await updateAdminResource(id, { status }); notify(`Resource ${status.toLowerCase()}.`); load() }
    catch (err) { notify(err.message, true) }
  }

  // Report actions
  async function handleResolve(reportId, action) {
    try {
      await resolveAdminReport(reportId, { action, postStatus: action === 'resolve' ? 'HIDDEN' : undefined })
      notify(action === 'resolve' ? 'Report resolved — content hidden.' : 'Report dismissed.')
      load()
    } catch (err) { notify(err.message, true) }
  }

  const TABS = [
    { id: 'doctors', label: `Doctor Review (${doctors.length})` },
    { id: 'users', label: `Users (${users.length})` },
    { id: 'institutions', label: `Institutions (${institutions.length})` },
    { id: 'resources', label: `Resources & Videos (${publishedResources.length})` },
    { id: 'pending', label: `Pending Submissions (${resources.length})` },
    { id: 'community', label: `Community Posts (${communityPosts.length})` },
    { id: 'reports', label: `Reports (${reports.length})` },
  ]

  return (
    <div className="page admin">
      <div className="container">
        <div className="admin__header">
          <div>
            <h1>Admin Panel</h1>
            <p>Manage CareBridge data, users, professionals and moderation.</p>
          </div>
        </div>

        {message.text && (
          <div className={`admin__message ${message.isError ? 'admin__message--error' : 'admin__message--success'}`} role="status">
            {message.text}
          </div>
        )}

        <nav className="admin__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin__tab ${activeTab === tab.id ? 'admin__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {loading && <div className="admin__loading"><Loader2 size={20} className="spin" /> Loading data...</div>}

        {/* ======== DOCTOR VERIFICATION ======== */}
        {activeTab === 'doctors' && !loading && (
          <section className="admin__section">
            <h2>Verification queue ({doctors.length})</h2>
            {doctors.length === 0 && <p className="admin__empty">No pending doctor verifications.</p>}
            {doctors.map((doc) => (
              <article className="admin__row" key={doc.id}>
                <div className="admin__row-info">
                  <h3>{doc.name}</h3>
                  <p className="admin__row-meta">{doc.professionType || doc.providerType} · {doc.specialty}</p>
                  <p className="admin__row-meta">{doc.qualification} · License: {doc.licenseNumber || 'Not provided'}</p>
                  <p className="admin__row-meta">{doc.visitingDays} · {doc.visitingHours} · {doc.phone || 'No phone'}</p>
                  <p className="admin__row-meta">Email: {doc.owner?.email}</p>
                  {doc.certificates?.length > 0 && (
                    <p className="admin__row-meta">Certificates: {doc.certificates.length} submitted</p>
                  )}
                </div>
                <div className="admin__actions">
                  <Button size="sm" variant="primary" icon={Check} onClick={() => decide(doc.id, 'VERIFIED')}>Approve</Button>
                  <Button size="sm" variant="outline" icon={X} onClick={() => decide(doc.id, 'REJECTED')}>Reject</Button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* ======== USER MANAGEMENT ======== */}
        {activeTab === 'users' && !loading && (
          <section className="admin__section">
            <h2>User management ({users.length})</h2>
            {users.map((u) => (
              <article className="admin__row" key={u.id}>
                <div className="admin__row-info">
                  <h3>{u.name} {u.isBanned && <span className="admin__banned-badge">BANNED</span>}</h3>
                  <p className="admin__row-meta">{u.email} · {u.role}</p>
                  <p className="admin__row-meta mono">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="admin__actions">
                  <Button size="sm" variant="outline" icon={Ban} onClick={() => toggleBan(u)}>
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </Button>
                  <Button size="sm" variant="outline" icon={Trash2} onClick={() => remove(u.id, u.name)}>Delete</Button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* ======== INSTITUTIONS ======== */}
        {activeTab === 'institutions' && !loading && (
          <section className="admin__section">
            <div className="admin__section-head">
              <h2>Institutions &amp; Schools ({institutions.length})</h2>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => setShowInstForm((v) => !v)}>
                {showInstForm ? 'Cancel' : 'Add institution'}
              </Button>
            </div>

            {showInstForm && (
              <form className="admin__form admin__form--grid" onSubmit={handleAddInstitution}>
                <h3>Add new institution / school</h3>
                <div className="admin__form-row">
                  <label>Name *</label>
                  <input placeholder="e.g. Autism Welfare Foundation" value={instForm.name} onChange={(e) => setInstForm({ ...instForm, name: e.target.value })} required />
                </div>
                <div className="admin__form-row admin__form-row--2col">
                  <div>
                    <label>Type</label>
                    <select value={instForm.type} onChange={(e) => setInstForm({ ...instForm, type: e.target.value })}>
                      <option value="SCHOOL">School</option>
                      <option value="THERAPY_CENTER">Therapy Center</option>
                      <option value="HOSPITAL">Hospital</option>
                      <option value="CLINIC">Clinic</option>
                      <option value="SUPPORT_CENTER">Support Center</option>
                    </select>
                  </div>
                  <div>
                    <label>Ownership</label>
                    <select value={instForm.ownership} onChange={(e) => setInstForm({ ...instForm, ownership: e.target.value })}>
                      <option value="GOVERNMENT">Government</option>
                      <option value="PRIVATE">Private</option>
                      <option value="NGO">NGO</option>
                    </select>
                  </div>
                </div>
                <div className="admin__form-row">
                  <label>District</label>
                  <input placeholder="e.g. Dhaka" value={instForm.district} onChange={(e) => setInstForm({ ...instForm, district: e.target.value })} />
                </div>
                <div className="admin__form-row">
                  <label>Address</label>
                  <input placeholder="Full street address" value={instForm.address} onChange={(e) => setInstForm({ ...instForm, address: e.target.value })} />
                </div>
                <div className="admin__form-row">
                  <label>Website</label>
                  <input type="url" placeholder="https://..." value={instForm.website} onChange={(e) => setInstForm({ ...instForm, website: e.target.value })} />
                </div>
                <div className="admin__form-row admin__form-row--2col">
                  <div>
                    <label>Latitude (for map pin)</label>
                    <input type="number" step="any" placeholder="e.g. 23.8103" value={instForm.latitude} onChange={(e) => setInstForm({ ...instForm, latitude: e.target.value })} />
                  </div>
                  <div>
                    <label>Longitude (for map pin)</label>
                    <input type="number" step="any" placeholder="e.g. 90.4125" value={instForm.longitude} onChange={(e) => setInstForm({ ...instForm, longitude: e.target.value })} />
                  </div>
                </div>
                <div className="admin__form-actions">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? <><Loader2 size={14} className="spin" /> Saving...</> : 'Add institution'}
                  </Button>
                </div>
              </form>
            )}

            <div className="admin__list">
              {institutions.slice(0, 50).map((item) => (
                <article className="admin__row" key={item.id}>
                  <div className="admin__row-info">
                    <h3>{item.name}</h3>
                    <p className="admin__row-meta">{item.type} · {item.ownership} · {item.district || 'District not set'}</p>
                    {item.address && <p className="admin__row-meta">{item.address}</p>}
                    <p className="admin__row-meta mono">
                      Coords: {item.latitude ? `${item.latitude}, ${item.longitude}` : 'Not set (no map pin)'}
                    </p>
                    {item.website && (
                      <a href={item.website} target="_blank" rel="noreferrer" className="admin__row-link">
                        <ExternalLink size={12} /> {item.website}
                      </a>
                    )}
                  </div>
                  <div className="admin__actions">
                    <Button size="sm" variant="outline" icon={Trash2} onClick={() => handleDeleteInstitution(item.id, item.name)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ======== ADD RESOURCES ======== */}
        {activeTab === 'resources' && !loading && (
          <section className="admin__section">
            <div className="admin__section-head">
              <h2>Add Resource (YouTube Video or Article)</h2>
              <Button size="sm" variant="primary" icon={PlusCircle} onClick={() => setShowResForm((v) => !v)}>
                {showResForm ? 'Cancel' : 'New resource'}
              </Button>
            </div>

            {showResForm && (
              <form className="admin__form admin__form--grid" onSubmit={handleAddResource}>
                <h3>Publish a new resource to the database</h3>
                <div className="admin__form-row">
                  <label>Type *</label>
                  <div className="admin__type-toggle">
                    {[{ v: 'VIDEO', icon: Youtube, label: 'YouTube Video' }, { v: 'ARTICLE', icon: FileText, label: 'Article' }, { v: 'GUIDE', icon: Link2, label: 'Guide' }].map(({ v, icon: Icon, label }) => (
                      <button
                        type="button"
                        key={v}
                        className={`admin__type-btn ${resForm.type === v ? 'admin__type-btn--active' : ''}`}
                        onClick={() => setResForm((f) => ({ ...f, type: v }))}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="admin__form-row">
                  <label>Title *</label>
                  <input placeholder="e.g. Understanding Autism Spectrum Disorder" value={resForm.title} onChange={(e) => setResForm({ ...resForm, title: e.target.value })} required />
                </div>
                <div className="admin__form-row">
                  <label>Summary / Description</label>
                  <textarea placeholder="Brief description of the resource..." rows={3} value={resForm.summary} onChange={(e) => setResForm({ ...resForm, summary: e.target.value })} />
                </div>
                <div className="admin__form-row">
                  <label>{resForm.type === 'VIDEO' ? 'YouTube URL' : 'Article URL'} *</label>
                  <input
                    type="url"
                    placeholder={resForm.type === 'VIDEO' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                    value={resForm.externalUrl}
                    onChange={(e) => setResForm({ ...resForm, externalUrl: e.target.value })}
                    required
                  />
                </div>
                <div className="admin__form-row">
                  <label>Source / Author name</label>
                  <input placeholder="e.g. Autism Society of America" value={resForm.sourceName} onChange={(e) => setResForm({ ...resForm, sourceName: e.target.value })} />
                </div>
                <div className="admin__form-row">
                  <label className="admin__form-checkbox">
                    <input type="checkbox" checked={resForm.featured} onChange={(e) => setResForm({ ...resForm, featured: e.target.checked })} />
                    <span>Mark as featured (shows on homepage)</span>
                  </label>
                </div>
                <div className="admin__form-actions">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? <><Loader2 size={14} className="spin" /> Publishing...</> : 'Publish resource'}
                  </Button>
                </div>
              </form>
            )}

            <div className="admin__resource-hint">
              <p>Resources published here will immediately appear in the Resources section for all logged-in users.</p>
            </div>

            <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>All Published Resources ({publishedResources.length})</h3>
            <div className="admin__list">
              {publishedResources.map((res) => (
                <article className="admin__row" key={res.id}>
                  <div className="admin__row-info">
                    <h3>{res.title}</h3>
                    <p className="admin__row-meta">Type: {res.type} · Source: {res.sourceName || 'CareBridge'} {res.featured ? '· ⭐ Featured' : ''}</p>
                    {res.summary && <p className="admin__row-meta">{res.summary}</p>}
                    {res.externalUrl && (
                      <a href={res.externalUrl} target="_blank" rel="noreferrer" className="admin__row-link">
                        <ExternalLink size={12} /> {res.externalUrl}
                      </a>
                    )}
                  </div>
                  <div className="admin__actions">
                    <Button size="sm" variant="outline" icon={Trash2} onClick={() => handleDeletePublishedResource(res.id, res.title)}>
                      Delete Resource
                    </Button>
                  </div>
                </article>
              ))}
              {publishedResources.length === 0 && <p className="admin__empty">No published resources found.</p>}
            </div>
          </section>
        )}

        {/* ======== PENDING RESOURCE REVIEW ======== */}
        {activeTab === 'pending' && !loading && (
          <section className="admin__section">
            <h2>User-submitted resources pending review ({resources.length})</h2>
            {resources.length === 0 && <p className="admin__empty">No resources pending review.</p>}
            {resources.map((res) => (
              <article className="admin__row" key={res.id}>
                <div className="admin__row-info">
                  <h3>{res.title}</h3>
                  <p className="admin__row-meta">{res.type} · Submitted by {res.author?.name || 'Unknown'}</p>
                  {res.summary && <p className="admin__row-meta">{res.summary}</p>}
                  {res.externalUrl && (
                    <a href={res.externalUrl} target="_blank" rel="noreferrer" className="admin__row-link">
                      <ExternalLink size={12} /> {res.externalUrl}
                    </a>
                  )}
                </div>
                <div className="admin__actions">
                  <Button size="sm" variant="primary" onClick={() => reviewResource(res.id, 'PUBLISHED')}>Publish</Button>
                  <Button size="sm" variant="outline" onClick={() => reviewResource(res.id, 'REJECTED')}>Reject</Button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* ======== COMMUNITY POSTS ======== */}
        {activeTab === 'community' && !loading && (
          <section className="admin__section">
            <div className="admin__section-head">
              <h2>All Community Discussions ({communityPosts.length})</h2>
              <a href="/community/new" target="_blank" rel="noreferrer">
                <Button size="sm" variant="primary">Create Forum Post</Button>
              </a>
            </div>
            {communityPosts.length === 0 && <p className="admin__empty">No community posts yet.</p>}
            <div className="admin__list">
              {communityPosts.map((p) => (
                <article className="admin__row" key={p.id}>
                  <div className="admin__row-info">
                    <h3>
                      {p.title}{' '}
                      {p.isAnonymous && (
                        <span className="admin__banned-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                          ANONYMOUS
                        </span>
                      )}
                    </h3>
                    <p className="admin__row-meta">
                      Author: {p.author?.name || 'Anonymous'} · {new Date(p.createdAt).toLocaleDateString()}
                      {p.specialty && ` · Topic: ${p.specialty.name}`}
                      {` · ${p._count?.comments || 0} comments`}
                    </p>
                    <p className="admin__row-meta">{p.body?.slice(0, 140)}...</p>
                  </div>
                  <div className="admin__actions">
                    <a href={`/community/${p.id}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="primary">
                        View &amp; Comment
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" icon={Trash2} onClick={() => handleDeletePost(p.id, p.title)}>
                      Delete Post
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ======== COMMUNITY REPORTS ======== */}
        {activeTab === 'reports' && !loading && (
          <section className="admin__section">
            <h2>Community reports ({reports.length})</h2>
            {reports.length === 0 && <p className="admin__empty">No pending reports.</p>}
            {reports.map((report) => (
              <article className="admin__row" key={report.id}>
                <div className="admin__row-info">
                  {report.post && (
                    <>
                      <h3>Post: &quot;{report.post.title}&quot;</h3>
                      <p className="admin__row-meta">Author: {report.post.author?.name}</p>
                    </>
                  )}
                  {report.comment && (
                    <>
                      <h3>Comment on post</h3>
                      <p className="admin__row-meta">Comment: &quot;{report.comment.body?.slice(0, 80)}...&quot;</p>
                      <p className="admin__row-meta">Author: {report.comment.author?.name}</p>
                    </>
                  )}
                  <p className="admin__row-reason">Reason: {report.reason}</p>
                  <p className="admin__row-meta">Reported by: {report.reporter?.name} ({report.reporter?.role})</p>
                </div>
                <div className="admin__actions">
                  <Button size="sm" variant="primary" icon={Check} onClick={() => handleResolve(report.id, 'resolve')}>
                    Hide content
                  </Button>
                  <Button size="sm" variant="outline" icon={X} onClick={() => handleResolve(report.id, 'dismiss')}>
                    Dismiss
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
