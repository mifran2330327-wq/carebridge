import { query } from '../config/db.js'

const BASE_SELECT = `
  SELECT
    sc.id, sc.name, sc.type, sc.location_text AS "location",
    sc.age_range_text AS "ageRange", sc.rating, sc.image_url AS "image",
    COALESCE(
      json_agg(f.name) FILTER (WHERE f.name IS NOT NULL), '[]'
    ) AS facilities
  FROM schools sc
  LEFT JOIN school_facilities sf ON sf.school_id = sc.id
  LEFT JOIN facilities f ON f.id = sf.facility_id
`

// GET /api/schools?q=&type=
export async function listSchools(req, res, next) {
  try {
    const { q, type } = req.query
    const conditions = []
    const params = []

    if (q) {
      params.push(`%${q.toLowerCase()}%`)
      conditions.push(`LOWER(sc.name) LIKE $${params.length}`)
    }
    if (type) {
      params.push(type)
      conditions.push(`sc.type = $${params.length}`)
    }

    let sql = BASE_SELECT
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`
    sql += ' GROUP BY sc.id ORDER BY sc.rating DESC'

    const { rows } = await query(sql, params)
    res.json({ schools: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/schools/:id
export async function getSchool(req, res, next) {
  try {
    const { rows } = await query(`${BASE_SELECT} WHERE sc.id = $1 GROUP BY sc.id`, [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'School not found.' })
    res.json({ school: rows[0] })
  } catch (err) {
    next(err)
  }
}
