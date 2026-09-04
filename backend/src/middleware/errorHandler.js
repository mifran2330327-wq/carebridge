// -----------------------------------------------------------------------
// Centralized error handler — every controller can `throw` or call
// next(err) and it lands here instead of duplicating try/catch responses
// everywhere. Keep controllers focused on the happy path.
// -----------------------------------------------------------------------
export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(err, req, res, _next) {
  console.error(err)

  // Postgres unique_violation (duplicate email, duplicate favorite, etc.)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That record already exists.' })
  }

  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Something went wrong on our end.' })
}
