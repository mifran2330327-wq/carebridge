import jwt from 'jsonwebtoken'

// Signs a JWT carrying the user's id + email. Used right after signup/login.
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}
