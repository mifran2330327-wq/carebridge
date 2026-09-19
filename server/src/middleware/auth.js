import jwt from 'jsonwebtoken'

export function requireAuth(request, response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    return response.status(401).json({ error: 'Authentication required' })
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    response.status(401).json({ error: 'Invalid or expired token' })
  }
}
