import { query } from '../config/db.js'

// Shared SELECT — aggregates each professional's specialties into an array
// via json_agg, so the frontend gets the same shape as its mock data
// (professional.specialties = ['Autism', 'Apraxia', ...]).
const BASE_SELECT = `
  SELECT
    p.id, p.name, p.role, p.location_text AS "location",
    p.price_text AS "price", p.availability_text AS "availability",
    p.rating, p.reviews_count AS "reviews", p.verified,
    COALESCE(
      json_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '[]'
    ) AS specialties
  FROM professionals p
  LEFT JOIN professional_specialties ps ON ps.professional_id = p.id
  LEFT JOIN specialties s ON s.id = ps.specialty_id
`

// GET /api/professionals?q=&specialty=
export async function listProfessionals(req, res, next) {
  try {
    const { q, specialty } = req.query
    const conditions = []
    const params = []

    if (q) {
      params.push(`%${q.toLowerCase()}%`)
      conditions.push(`(LOWER(p.name) LIKE $${params.length} OR LOWER(p.role) LIKE $${params.length})`)
    }

    let sql = BASE_SELECT
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`
    sql += ' GROUP BY p.id'

    if (specialty) {
      // Filter on the aggregated array after grouping.
      params.push(specialty)
      sql += ` HAVING $${params.length} = ANY(array_agg(s.name))`
    }

    sql += ' ORDER BY p.rating DESC'

    const { rows } = await query(sql, params)
    res.json({ professionals: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/professionals/:id
export async function getProfessional(req, res, next) {
  try {
    const { rows } = await query(`${BASE_SELECT} WHERE p.id = $1 GROUP BY p.id`, [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Professional not found.' })
    res.json({ professional: rows[0] })
  } catch (err) {
    next(err)
  }
}
