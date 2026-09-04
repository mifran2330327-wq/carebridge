import { query } from '../config/db.js'

// GET /api/favorites — { professionalIds: [...], schoolIds: [...] }
export async function listFavorites(req, res, next) {
  try {
    const [pros, schools] = await Promise.all([
      query('SELECT professional_id FROM favorite_professionals WHERE user_id = $1', [req.user.id]),
      query('SELECT school_id FROM favorite_schools WHERE user_id = $1', [req.user.id]),
    ])
    res.json({
      professionalIds: pros.rows.map((r) => r.professional_id),
      schoolIds: schools.rows.map((r) => r.school_id),
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/favorites/professionals/:id — toggle on
export async function saveProfessional(req, res, next) {
  try {
    await query(
      'INSERT INTO favorite_professionals (user_id, professional_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id],
    )
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// DELETE /api/favorites/professionals/:id — toggle off
export async function unsaveProfessional(req, res, next) {
  try {
    await query('DELETE FROM favorite_professionals WHERE user_id = $1 AND professional_id = $2', [req.user.id, req.params.id])
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// POST /api/favorites/schools/:id
export async function saveSchool(req, res, next) {
  try {
    await query(
      'INSERT INTO favorite_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id],
    )
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// DELETE /api/favorites/schools/:id
export async function unsaveSchool(req, res, next) {
  try {
    await query('DELETE FROM favorite_schools WHERE user_id = $1 AND school_id = $2', [req.user.id, req.params.id])
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
