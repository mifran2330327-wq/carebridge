import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// -----------------------------------------------------------------------
// A single shared connection pool for the whole app. Every controller
// imports { query } from here instead of managing its own client, so
// connections are reused instead of opened per-request.
// -----------------------------------------------------------------------
const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err)
})

export function query(text, params) {
  return pool.query(text, params)
}

export default pool
