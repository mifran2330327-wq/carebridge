import { query } from '../config/db.js'

// GET /api/resources?category=
export async function listResources(req, res, next) {
  try {
    const { category } = req.query
    const params = []
    let sql = `
      SELECT id, title, category, excerpt, read_time AS "readTime", image_url AS "image"
      FROM resources
    `
    if (category) {
      params.push(category)
      sql += ` WHERE category = $1`
    }
    sql += ' ORDER BY created_at DESC'

    const { rows } = await query(sql, params)
    res.json({ resources: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/resources/:id — full article body
export async function getResource(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, title, category, excerpt, body, read_time AS "readTime", image_url AS "image"
       FROM resources WHERE id = $1`,
      [req.params.id],
    )
    if (!rows[0]) return res.status(404).json({ error: 'Resource not found.' })
    res.json({ resource: rows[0] })
  } catch (err) {
    next(err)
  }
}
