import { query } from '../config/db.js'

// GET /api/children — every child belonging to the logged-in parent
export async function listChildren(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, name, age, diagnosis, support_level AS "supportLevel", notes
       FROM children WHERE parent_id = $1 ORDER BY created_at ASC`,
      [req.user.id],
    )
    res.json({ children: rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/children
export async function createChild(req, res, next) {
  try {
    const { name, age, diagnosis, supportLevel, notes } = req.body
    if (!name) return res.status(400).json({ error: 'name is required.' })

    const { rows } = await query(
      `INSERT INTO children (parent_id, name, age, diagnosis, support_level, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, age, diagnosis, support_level AS "supportLevel", notes`,
      [req.user.id, name, age || null, diagnosis || null, supportLevel || 'Level 1', notes || null],
    )
    res.status(201).json({ child: rows[0] })
  } catch (err) {
    next(err)
  }
}

// PUT /api/children/:id — only the owning parent can edit their child
export async function updateChild(req, res, next) {
  try {
    const { id } = req.params
    const { name, age, diagnosis, supportLevel, notes } = req.body

    const { rows } = await query(
      `UPDATE children
       SET name = COALESCE($1, name),
           age = COALESCE($2, age),
           diagnosis = COALESCE($3, diagnosis),
           support_level = COALESCE($4, support_level),
           notes = COALESCE($5, notes),
           updated_at = now()
       WHERE id = $6 AND parent_id = $7
       RETURNING id, name, age, diagnosis, support_level AS "supportLevel", notes`,
      [name, age, diagnosis, supportLevel, notes, id, req.user.id],
    )

    if (!rows[0]) return res.status(404).json({ error: 'Child not found.' })
    res.json({ child: rows[0] })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/children/:id
export async function deleteChild(req, res, next) {
  try {
    const { rowCount } = await query(
      'DELETE FROM children WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id],
    )
    if (!rowCount) return res.status(404).json({ error: 'Child not found.' })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
