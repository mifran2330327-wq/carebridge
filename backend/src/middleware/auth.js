import jwt from 'jsonwebtoken'

// -----------------------------------------------------------------------
// Protects a route by requiring a valid "Authorization: Bearer <token>"
// header. On success, attaches { id, email } to req.user for downstream
// controllers to use (e.g. "only return this parent's own children").
// -----------------------------------------------------------------------
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
