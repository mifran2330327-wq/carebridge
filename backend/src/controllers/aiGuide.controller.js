import { query } from '../config/db.js'

// -----------------------------------------------------------------------
// POST /api/ai-guide  { message }
// A lightweight keyword-routed reply so the frontend's AI Virtual Guide
// widget has a real endpoint to call instead of a client-side setTimeout.
// This is intentionally simple — swap the body of this function for a
// call to an LLM (e.g. the Claude API via @anthropic-ai/sdk) when ready;
// the request/response shape below is already what the frontend expects.
// -----------------------------------------------------------------------
export async function chatWithGuide(req, res, next) {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'message is required.' })

    const text = message.toLowerCase()

    if (text.includes('speech') || text.includes('therapist')) {
      const { rows } = await query(
        `SELECT name, role, location_text AS location FROM professionals
         WHERE role ILIKE '%speech%' ORDER BY rating DESC LIMIT 1`,
      )
      const match = rows[0]
      return res.json({
        reply: match
          ? `${match.name} (${match.role}) in ${match.location} is a strong match — want me to open their profile?`
          : "I couldn't find a speech therapist in the directory yet, but the Therapist Directory lets you filter by specialty.",
      })
    }

    if (text.includes('school')) {
      return res.json({
        reply: 'You can compare schools side by side — filter by type (inclusive vs. special needs) and age range in the School Directory.',
      })
    }

    if (text.includes('iep')) {
      return res.json({
        reply: 'An IEP (Individualized Education Plan) outlines your child’s learning goals and the support the school provides. There’s a full guide on this in the Resource Library.',
      })
    }

    return res.json({
      reply: "Based on what you've told me, I'd suggest starting with the Therapist Directory and filtering by specialty. Want me to open it for you?",
    })
  } catch (err) {
    next(err)
  }
}
