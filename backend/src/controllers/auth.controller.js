import bcrypt from 'bcrypt'
import { query } from '../config/db.js'
import { generateToken } from '../utils/generateToken.js'

// POST /api/auth/signup
export async function signup(req, res, next) {
  try {
    const { name, email, password, locationText } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, location_text)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, location_text, created_at`,
      [name, email, passwordHash, locationText || null],
    )

    const user = rows[0]
    const token = generateToken(user)

    res.status(201).json({ user, token })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' })
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const matches = await bcrypt.compare(password, user.password_hash)
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = generateToken(user)
    delete user.password_hash

    res.json({ user, token })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me  (requires auth)
export async function me(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT id, name, email, phone, location_text, created_at FROM users WHERE id = $1',
      [req.user.id],
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' })
    res.json({ user: rows[0] })
  } catch (err) {
    next(err)
  }
}
