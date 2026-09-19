import { requireAuth } from './auth.js'

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'ADMIN') return response.status(403).json({ error: 'Admin access required' })
  next()
}

export function isAdmin(request, response, next) {
  requireAuth(request, response, () => requireAdmin(request, response, next))
}
