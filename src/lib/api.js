const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const { headers, ...restOptions } = options
  const response = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  })
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text?.slice(0, 150) || response.statusText }
  }
  if (!response.ok) throw new Error(data.error || data.message || `Request failed with status ${response.status}`)
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
export function rescheduleAppointment(id, scheduledAt) {
  const session = getSession()
  return request(`/appointments/${id}/reschedule`, { method: 'PATCH', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify({ scheduledAt }) })
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

export async function getCommunityPosts(params = {}) {
  const session = getSession()
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
  return request(`/community${query.toString() ? `?${query}` : ''}`, { headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export async function createCommunityPost(form) {
  const session = getSession()
  return request('/community', { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}

export async function getCommunityPost(id) {
  const session = getSession()
  return request(`/community/${id}`, { headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export async function addCommunityComment(postId, form) {
  const session = getSession()
  return request(`/community/${postId}/comments`, { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}

export async function toggleCommunityReaction(postId) {
  const session = getSession()
  return request(`/community/${postId}/reactions`, { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export async function deleteCommunityPost(id) {
  const session = getSession()
  return request(`/community/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export async function reportCommunityContent(form) {
  const session = getSession()
  return request('/community/reports', { method: 'POST', headers: { Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify(form) })
}

export async function getNotifications(params = {}) {
  const session = getSession()
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
  return request(`/notifications${query.toString() ? `?${query}` : ''}`, { headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export async function markNotificationRead(id) {
  const session = getSession()
  return request(`/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${session?.token || ''}` } })
}

export async function markAllNotificationsRead() {
  const session = getSession()
  return request('/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${session?.token || ''}` } })
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
export const createAdminResource = (body) => adminRequest('/resources', { method: 'POST', body: JSON.stringify(body) })
export const updateAdminResource = (id, body) => adminRequest(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteAdminResource = (id) => adminRequest(`/resources/${id}`, { method: 'DELETE' })
export const createInstitution = (body) => adminRequest('/institutions', { method: 'POST', body: JSON.stringify(body) })
export const updateInstitution = (id, body) => adminRequest(`/institutions/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteInstitution = (id) => adminRequest(`/institutions/${id}`, { method: 'DELETE' })

export const getAdminReports = () => adminRequest('/reports')
export const resolveAdminReport = (id, body) => adminRequest(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) })