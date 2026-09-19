const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export function saveSession(data) {
  localStorage.setItem('carebridge_token', data.token)
  localStorage.setItem('carebridge_user', JSON.stringify(data.user))
  window.dispatchEvent(new Event('carebridge-auth'))
}

export function getSession() {
  const token = localStorage.getItem('carebridge_token')
  const user = localStorage.getItem('carebridge_user')
  return token && user ? { token, user: JSON.parse(user) } : null
}

export function logout() {
  localStorage.removeItem('carebridge_token')
  localStorage.removeItem('carebridge_user')
}

export const register = (form) => request('/auth/register', { method: 'POST', body: JSON.stringify(form) })
export const login = (form) => request('/auth/login', { method: 'POST', body: JSON.stringify(form) })
export function updateProfessional(form) {
  const session = getSession()
  return request('/auth/professional', { method: 'PATCH', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}
export function addCertificate(form) {
  const session = getSession()
  return request('/auth/certificates', { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}
export const getDirectory = () => request('/directory')
export const getResources = (params = {}) => { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)); return request(`/resources${query.toString() ? `?${query}` : ''}`) }
export function createResource(form) {
  const session = getSession()
  return request('/resources', { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}
export const getMyResources = () => { const session = getSession(); return request('/resources/mine', { headers: { Authorization: `Bearer ${session?.token || ''}` } }) }
export const getLookups = (query = '') => request(`/lookups${query ? `?q=${encodeURIComponent(query)}` : ''}`)

export function getAppointments() {
  const session = getSession()
  return request('/appointments', { headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export function createAppointment(form) {
  const session = getSession()
  return request('/appointments', { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}
export function updateAppointmentStatus(id, status) {
  const session = getSession()
  return request(`/appointments/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify({ status }) })
}

export function getChildren() {
  const session = getSession()
  return request('/children', { headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export function createChild(form) {
  const session = getSession()
  return request('/children', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.token || ''}` },
    body: JSON.stringify(form),
  })
}

export function deleteChild(id) {
  const session = getSession()
  return request(`/children/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

async function adminRequest(path, options = {}) {
  const session = getSession()
  return request(`/admin${path}`, { ...options, headers: { Authorization: `Bearer ${session?.token || ''}`, ...(options.headers || {}) } })
}

export const getPendingDoctors = () => adminRequest('/doctors/pending')
export const verifyDoctor = (id, body) => adminRequest(`/doctors/${id}/verify`, { method: 'PATCH', body: JSON.stringify(body) })
export const getAdminUsers = () => adminRequest('/users')
export const banUser = (id, banned = true) => adminRequest(`/users/${id}/ban`, { method: 'PATCH', body: JSON.stringify({ banned }) })
export const deleteUser = (id) => adminRequest(`/users/${id}`, { method: 'DELETE' })
export const getAdminResources = () => adminRequest('/resources/pending')
export const updateAdminResource = (id, body) => adminRequest(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const createInstitution = (body) => adminRequest('/institutions', { method: 'POST', body: JSON.stringify(body) })
export const updateInstitution = (id, body) => adminRequest(`/institutions/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteInstitution = (id) => adminRequest(`/institutions/${id}`, { method: 'DELETE' })