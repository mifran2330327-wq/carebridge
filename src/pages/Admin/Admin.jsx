import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, X, Ban, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import { banUser, createInstitution, deleteInstitution, deleteUser, getAdminResources, getAdminUsers, getDirectory, getPendingDoctors, getSession, updateAdminResource, verifyDoctor } from '../../lib/api.js'
import './Admin.css'

export default function Admin() {
  const session = getSession()
  const [doctors, setDoctors] = useState([])
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [institutions, setInstitutions] = useState([])
  const [resources, setResources] = useState([])
  const [institution, setInstitution] = useState({ name: '', type: '', district: '', address: '', website: '' })

  function load() { Promise.all([getPendingDoctors(), getAdminUsers(), getDirectory(), getAdminResources()]).then(([pending, allUsers, directory, pendingResources]) => { setDoctors(pending.doctors); setUsers(allUsers.users); setInstitutions(directory.institutions); setResources(pendingResources.resources) }).catch((error) => setMessage(error.message)) }
  useEffect(load, [])

  if (session?.user.role !== 'ADMIN') return <Navigate to="/" replace />

  async function decide(id, status) {
    try { await verifyDoctor(id, { status, note: status === 'REJECTED' ? window.prompt('Reason for rejection') || 'Please update your verification documents.' : undefined }); setMessage(`Doctor ${status.toLowerCase()}.`); load() } catch (error) { setMessage(error.message) }
  }
  async function remove(id) { if (!window.confirm('Delete this user permanently?')) return; try { await deleteUser(id); setMessage('User deleted.'); load() } catch (error) { setMessage(error.message) } }
  async function toggleBan(user) { try { await banUser(user.id, !user.isBanned); setMessage(user.isBanned ? 'User unbanned.' : 'User banned.'); load() } catch (error) { setMessage(error.message) } }
  async function addInstitution(event) { event.preventDefault(); try { await createInstitution(institution); setInstitution({ name: '', type: '', district: '', address: '', website: '' }); setMessage('Institution added.'); load() } catch (error) { setMessage(error.message) } }
  async function removeInstitution(id) { if (!window.confirm('Delete this institution?')) return; try { await deleteInstitution(id); setMessage('Institution deleted.'); load() } catch (error) { setMessage(error.message) } }
  async function reviewResource(id, status) { try { await updateAdminResource(id, { status }); setMessage(`Resource ${status.toLowerCase()}.`); load() } catch (error) { setMessage(error.message) } }

  return <div className="page admin"><div className="container">
    <div className="admin__header"><div><h1>Admin panel</h1><p>Review professionals and manage CareBridge accounts.</p></div></div>
    {message && <p className="admin__message" role="status">{message}</p>}
    <section className="admin__section"><h2>Verification queue ({doctors.length})</h2>{doctors.map((doctor) => <article className="admin__row" key={doctor.id}><div><h3>{doctor.name}</h3><p>{doctor.professionType || doctor.providerType} · {doctor.specialty}</p><p>{doctor.qualification} · {doctor.licenseNumber || 'No license number submitted'}</p><p>{doctor.visitingDays} · {doctor.visitingHours} · {doctor.phone || 'No phone'}</p></div><div className="admin__actions"><Button size="sm" variant="primary" icon={Check} onClick={() => decide(doctor.id, 'VERIFIED')}>Approve</Button><Button size="sm" variant="outline" icon={X} onClick={() => decide(doctor.id, 'REJECTED')}>Reject</Button></div></article>)}{!doctors.length && <p>No pending doctors.</p>}</section>
    <section className="admin__section"><h2>User management ({users.length})</h2>{users.map((user) => <article className="admin__row" key={user.id}><div><h3>{user.name}</h3><p>{user.email} · {user.role}</p></div><div className="admin__actions"><Button size="sm" variant="outline" icon={Ban} onClick={() => toggleBan(user)}>{user.isBanned ? 'Unban' : 'Ban'}</Button><Button size="sm" variant="outline" icon={Trash2} onClick={() => remove(user.id)}>Delete</Button></div></article>)}</section>
    <section className="admin__section"><h2>Add institution or school</h2><form className="admin__form" onSubmit={addInstitution}>{Object.keys(institution).map((field) => <input key={field} placeholder={field} value={institution[field]} onChange={(event) => setInstitution({ ...institution, [field]: event.target.value })} required={field === 'name'} />)}<Button type="submit" size="sm" variant="primary">Add institution</Button></form><h3>Existing institutions ({institutions.length})</h3>{institutions.slice(0, 12).map((item) => <article className="admin__row" key={item.id}><div><strong>{item.name}</strong><p>{item.district || 'Location not specified'} · {item.verificationStatus}</p></div><Button size="sm" variant="outline" icon={Trash2} onClick={() => removeInstitution(item.id)}>Delete</Button></article>)}</section>
    <section className="admin__section"><h2>Resource review ({resources.length})</h2>{resources.map((resource) => <article className="admin__row" key={resource.id}><div><h3>{resource.title}</h3><p>By {resource.author.name}</p></div><div className="admin__actions"><Button size="sm" variant="primary" onClick={() => reviewResource(resource.id, 'PUBLISHED')}>Publish</Button><Button size="sm" variant="outline" onClick={() => reviewResource(resource.id, 'REJECTED')}>Reject</Button></div></article>)}{!resources.length && <p>No pending resources.</p>}</section>
  </div></div>
}
