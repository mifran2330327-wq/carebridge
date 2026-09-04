import { query } from '../config/db.js'

// GET /api/recommendations — every stored recommendation for the logged-in
// parent's children (joined so only their own children's recs come back).
export async function listRecommendations(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT r.id, c.name AS "forChild", r.type, r.title, r.reason
       FROM ai_recommendations r
       JOIN children c ON c.id = r.child_id
       WHERE c.parent_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id],
    )
    res.json({ recommendations: rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/recommendations/generate/:childId
// -----------------------------------------------------------------------
// A deliberately simple, explainable "AI" step: it matches a child's
// diagnosis text against professional specialties and school facilities
// by keyword overlap, and stores whatever it finds as new recommendation
// rows. This is the seam where a real model call (e.g. the Claude API)
// would slot in later — swap the matching logic below for a prompt that
// reasons over the child's full profile instead of simple keyword overlap.
// -----------------------------------------------------------------------
export async function generateRecommendations(req, res, next) {
  try {
    const { childId } = req.params

    const { rows: childRows } = await query(
      'SELECT * FROM children WHERE id = $1 AND parent_id = $2',
      [childId, req.user.id],
    )
    const child = childRows[0]
    if (!child) return res.status(404).json({ error: 'Child not found.' })

    const keywords = (child.diagnosis || '').toLowerCase().split(/[,\s]+/).filter(Boolean)
    if (keywords.length === 0) {
      return res.json({ recommendations: [] })
    }

    // Find professionals whose specialties share a keyword with the diagnosis.
    const { rows: proMatches } = await query(
      `SELECT DISTINCT p.id, p.name, p.role
       FROM professionals p
       JOIN professional_specialties ps ON ps.professional_id = p.id
       JOIN specialties s ON s.id = ps.specialty_id
       WHERE LOWER(s.name) = ANY($1::text[])
       LIMIT 2`,
      [keywords],
    )

    const created = []
    for (const pro of proMatches) {
      const { rows } = await query(
        `INSERT INTO ai_recommendations (child_id, type, target_id, title, reason)
         VALUES ($1, 'Professional', $2, $3, $4)
         RETURNING id, type, title, reason`,
        [childId, pro.id, `${pro.name} — ${pro.role}`, `Specializes in areas related to ${child.diagnosis}.`],
      )
      created.push({ ...rows[0], forChild: child.name })
    }

    res.status(201).json({ recommendations: created })
  } catch (err) {
    next(err)
  }
}
