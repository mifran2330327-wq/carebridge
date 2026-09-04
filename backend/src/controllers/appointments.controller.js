import { query } from '../config/db.js'

const BASE_SELECT = `
  SELECT
    a.id, a.appointment_date AS "date", a.appointment_time AS "time",
    a.mode, a.status, c.name AS "child",
    p.name AS "professional", p.role
  FROM appointments a
  JOIN children c ON c.id = a.child_id
  JOIN professionals p ON p.id = a.professional_id
  WHERE a.parent_id = $1
`

// GET /api/appointments?status=upcoming|completed|cancelled
export async function listAppointments(req, res, next) {
  try {
    const { status } = req.query
    const params = [req.user.id]
    let sql = BASE_SELECT

    if (status) {
      params.push(status)
      sql += ` AND a.status = $${params.length}`
    }
    sql += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC'

    const { rows } = await query(sql, params)
    res.json({ appointments: rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/appointments  { childId, professionalId, date, time, mode }
export async function createAppointment(req, res, next) {
  try {
    const { childId, professionalId, date, time, mode } = req.body
    if (!childId || !professionalId || !date || !time) {
      return res.status(400).json({ error: 'childId, professionalId, date, and time are required.' })
    }

    // Confirm the child actually belongs to this parent before booking.
    const childCheck = await query('SELECT id FROM children WHERE id = $1 AND parent_id = $2', [childId, req.user.id])
    if (!childCheck.rows[0]) {
      return res.status(403).json({ error: 'That child does not belong to your account.' })
    }

    const { rows: inserted } = await query(
      `INSERT INTO appointments (parent_id, child_id, professional_id, appointment_date, appointment_time, mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, childId, professionalId, date, time, mode || 'In-person'],
    )

    const { rows } = await query(`${BASE_SELECT} AND a.id = $2`, [req.user.id, inserted[0].id])
    res.status(201).json({ appointment: rows[0] })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/appointments/:id  { status, date, time }
export async function updateAppointment(req, res, next) {
  try {
    const { status, date, time } = req.body
    const { rows } = await query(
      `UPDATE appointments
       SET status = COALESCE($1, status),
           appointment_date = COALESCE($2, appointment_date),
           appointment_time = COALESCE($3, appointment_time)
       WHERE id = $4 AND parent_id = $5
       RETURNING id`,
      [status, date, time, req.params.id, req.user.id],
    )
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found.' })

    const { rows: full } = await query(`${BASE_SELECT} AND a.id = $2`, [req.user.id, req.params.id])
    res.json({ appointment: full[0] })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/appointments/:id
export async function cancelAppointment(req, res, next) {
  try {
    const { rowCount } = await query(
      `UPDATE appointments SET status = 'cancelled' WHERE id = $1 AND parent_id = $2`,
      [req.params.id, req.user.id],
    )
    if (!rowCount) return res.status(404).json({ error: 'Appointment not found.' })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
