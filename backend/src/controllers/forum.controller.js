import { query } from '../config/db.js'

// GET /api/forum — list posts, most recent first, with reply counts
export async function listPosts(req, res, next) {
  try {
    const { sort } = req.query // 'recent' (default) | 'active'
    const orderBy = sort === 'active' ? 'replies DESC' : 'fp.created_at DESC'

    const { rows } = await query(`
      SELECT
        fp.id, fp.title, fp.child_context AS "childContext", fp.tag,
        fp.created_at AS "createdAt", u.name AS "author",
        COUNT(fr.id)::int AS replies
      FROM forum_posts fp
      JOIN users u ON u.id = fp.author_id
      LEFT JOIN forum_replies fr ON fr.post_id = fp.id
      GROUP BY fp.id, u.name
      ORDER BY ${orderBy}
    `)
    res.json({ posts: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/forum/:id — one post + its replies
export async function getPost(req, res, next) {
  try {
    const { rows: postRows } = await query(
      `SELECT fp.id, fp.title, fp.child_context AS "childContext", fp.tag,
              fp.created_at AS "createdAt", u.name AS "author"
       FROM forum_posts fp JOIN users u ON u.id = fp.author_id
       WHERE fp.id = $1`,
      [req.params.id],
    )
    if (!postRows[0]) return res.status(404).json({ error: 'Post not found.' })

    const { rows: replies } = await query(
      `SELECT fr.id, fr.body, fr.created_at AS "createdAt", u.name AS "author"
       FROM forum_replies fr JOIN users u ON u.id = fr.author_id
       WHERE fr.post_id = $1 ORDER BY fr.created_at ASC`,
      [req.params.id],
    )

    res.json({ post: postRows[0], replies })
  } catch (err) {
    next(err)
  }
}

// POST /api/forum  { title, childContext, tag }  (requires auth)
export async function createPost(req, res, next) {
  try {
    const { title, childContext, tag } = req.body
    if (!title) return res.status(400).json({ error: 'title is required.' })

    const { rows } = await query(
      `INSERT INTO forum_posts (author_id, title, child_context, tag)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, child_context AS "childContext", tag, created_at AS "createdAt"`,
      [req.user.id, title, childContext || null, tag || 'General'],
    )
    res.status(201).json({ post: { ...rows[0], author: req.user.email, replies: 0 } })
  } catch (err) {
    next(err)
  }
}

// POST /api/forum/:id/replies  { body }  (requires auth)
export async function createReply(req, res, next) {
  try {
    const { body } = req.body
    if (!body) return res.status(400).json({ error: 'body is required.' })

    const { rows } = await query(
      `INSERT INTO forum_replies (post_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, body, created_at AS "createdAt"`,
      [req.params.id, req.user.id, body],
    )
    res.status(201).json({ reply: rows[0] })
  } catch (err) {
    next(err)
  }
}
