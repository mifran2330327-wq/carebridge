import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { maskAuthorName } from '../lib/mask.js'
import { createNotification } from '../lib/notification.js'

const router = Router()
const DEFAULT_PAGE_SIZE = 20

function parsePagination(query) {
  const take = Math.min(Math.max(parseInt(query.take || '20', 10), 1), 100)
  const skip = Math.max(parseInt(query.skip || '0', 10), 0)
  return { take, skip }
}

// Helper to format post for list response
function formatPostForList(post, currentUserId) {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    isAnonymous: post.isAnonymous,
    author: post.isAnonymous
      ? { name: maskAuthorName(post.authorId) }
      : { id: post.authorId, name: post.author?.name || 'CareBridge User' },
    specialty: post.specialty ? { id: post.specialty.id, name: post.specialty.name } : null,
    _count: {
      comments: post._count?.comments || 0,
      reactions: post._count?.reactions || 0,
    },
    userReacted: currentUserId
      ? post.reactions?.some((r) => r.userId === currentUserId) || false
      : false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

// Helper to format post for detail response
async function formatPostForDetail(post, currentUserId) {
  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    include: { author: { select: { id: true, name: true, professional: { select: { verificationStatus: true } } } } },
    orderBy: { createdAt: 'asc' },
  })

  const formattedComments = comments.map((c) => ({
    id: c.id,
    body: c.body,
    isAnonymous: c.isAnonymous,
    isExpertReply: c.isExpertReply,
    author: c.isAnonymous
      ? { name: maskAuthorName(c.authorId) }
      : { id: c.authorId, name: c.author?.name || 'CareBridge User', isExpert: c.author?.professional?.verificationStatus === 'VERIFIED' },
    createdAt: c.createdAt,
  }))

  return {
    id: post.id,
    title: post.title,
    body: post.body,
    isAnonymous: post.isAnonymous,
    author: post.isAnonymous
      ? { name: maskAuthorName(post.authorId) }
      : { id: post.authorId, name: post.author?.name || 'CareBridge User' },
    specialty: post.specialty ? { id: post.specialty.id, name: post.specialty.name } : null,
    _count: {
      comments: post._count?.comments || 0,
      reactions: post._count?.reactions || 0,
    },
    userReacted: currentUserId
      ? post.reactions?.some((r) => r.userId === currentUserId) || false
      : false,
    comments: formattedComments,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

// GET / - List posts
router.get('/', async (request, response) => {
  try {
    const { take, skip } = parsePagination(request.query)
    const { specialtyId, search } = request.query
    const currentUserId = request.user?.userId

    const where = {
      status: 'PUBLISHED',
      ...(specialtyId ? { specialtyId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          specialty: { select: { id: true, name: true } },
          _count: { select: { comments: true, reactions: true } },
          reactions: currentUserId ? { where: { userId: currentUserId } } : false,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.communityPost.count({ where }),
    ])

    response.json({
      posts: posts.map((p) => formatPostForList(p, currentUserId)),
      pagination: { total, take, skip },
    })
  } catch (error) {
    console.error('Failed to get community posts:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch community posts' })
  }
})

// POST / - Create a post (auth required)
router.post('/', requireAuth, async (request, response) => {
  const { title, body, isAnonymous = false, specialtyId } = request.body || {}
  if (!title?.trim() || !body?.trim()) {
    return response.status(400).json({ error: 'Title and body are required' })
  }

  try {
    if (specialtyId) {
      const specialty = await prisma.specialty.findUnique({ where: { id: specialtyId } })
      if (!specialty) return response.status(400).json({ error: 'Invalid specialty' })
    }

    const post = await prisma.communityPost.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        isAnonymous: Boolean(isAnonymous),
        authorId: request.user.userId,
        specialtyId: specialtyId || null,
      },
      include: { author: { select: { id: true, name: true } }, specialty: { select: { id: true, name: true } } },
    })

    response.status(201).json({ post: formatPostForList(post, request.user.userId) })
  } catch (error) {
    console.error('Failed to create community post:', error)
    response.status(500).json({ error: error.message || 'Failed to create discussion post' })
  }
})

// GET /:id - Single post with comments
router.get('/:id', async (request, response) => {
  try {
    const currentUserId = request.user?.userId
    const post = await prisma.communityPost.findUnique({
      where: { id: request.params.id },
      include: {
        author: { select: { id: true, name: true } },
        specialty: { select: { id: true, name: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: currentUserId ? { where: { userId: currentUserId } } : false,
      },
    })

    if (!post) return response.status(404).json({ error: 'Post not found' })
    if (post.status !== 'PUBLISHED' && post.authorId !== currentUserId && request.user?.role !== 'ADMIN') {
      return response.status(404).json({ error: 'Post not found' })
    }

    const detail = await formatPostForDetail(post, currentUserId)
    response.json({ post: detail })
  } catch (error) {
    console.error('Failed to get community post:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch discussion post' })
  }
})

// POST /:id/comments - Add comment (auth required)
router.post('/:id/comments', requireAuth, async (request, response) => {
  const { body, isAnonymous = false } = request.body || {}
  if (!body?.trim()) return response.status(400).json({ error: 'Comment body is required' })

  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: request.params.id },
      include: { author: { select: { id: true } } },
    })
    if (!post) return response.status(404).json({ error: 'Post not found' })
    if (post.status !== 'PUBLISHED') return response.status(403).json({ error: 'Cannot comment on hidden post' })

    // Determine if expert reply
    let isExpertReply = false
    if (request.user.role === 'DOCTOR') {
      const professional = await prisma.professional.findUnique({ where: { ownerId: request.user.userId } })
      if (professional?.verificationStatus === 'VERIFIED') isExpertReply = true
    }

    const comment = await prisma.comment.create({
      data: {
        body: body.trim(),
        isAnonymous: Boolean(isAnonymous),
        isExpertReply,
        authorId: request.user.userId,
        postId: post.id,
      },
      include: {
        author: { select: { id: true, name: true, professional: { select: { verificationStatus: true } } } },
      },
    })

    // Notify post author (if not self-comment)
    if (post.authorId !== request.user.userId) {
      await createNotification({
        userId: post.authorId,
        type: 'COMMUNITY_COMMENT',
        message: `${request.user.name} commented on your post "${post.title}"`,
        link: `/community/${post.id}`,
      })
    }

    // If expert reply, notify post author (separate notification type)
    if (isExpertReply && post.authorId !== request.user.userId) {
      await createNotification({
        userId: post.authorId,
        type: 'COMMUNITY_EXPERT_REPLY',
        message: `Verified professional ${request.user.name} replied to your post "${post.title}"`,
        link: `/community/${post.id}`,
      })
    }

    response.status(201).json({
      comment: {
        id: comment.id,
        body: comment.body,
        isAnonymous: comment.isAnonymous,
        isExpertReply: comment.isExpertReply,
        author: comment.isAnonymous
          ? { name: maskAuthorName(comment.authorId) }
          : { id: comment.authorId, name: comment.author?.name || 'CareBridge User', isExpert: comment.author?.professional?.verificationStatus === 'VERIFIED' },
        createdAt: comment.createdAt,
      },
    })
  } catch (error) {
    console.error('Failed to create comment:', error)
    response.status(500).json({ error: error.message || 'Failed to submit comment' })
  }
})

// POST /:id/reactions - Toggle reaction (auth required)
router.post('/:id/reactions', requireAuth, async (request, response) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: request.params.id } })
    if (!post) return response.status(404).json({ error: 'Post not found' })

    const existing = await prisma.reaction.findUnique({
      where: { userId_postId: { userId: request.user.userId, postId: post.id } },
    })

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      response.json({ reacted: false })
    } else {
      await prisma.reaction.create({ data: { userId: request.user.userId, postId: post.id } })
      response.status(201).json({ reacted: true })
    }
  } catch (error) {
    console.error('Failed to toggle reaction:', error)
    response.status(500).json({ error: error.message || 'Failed to toggle reaction' })
  }
})

// DELETE /comments/:commentId - Delete a comment (author or admin only)
router.delete('/comments/:commentId', requireAuth, async (request, response) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: request.params.commentId } })
    if (!comment) return response.status(404).json({ error: 'Comment not found' })

    const isAuthor = comment.authorId === request.user.userId
    const isAdmin = request.user.role === 'ADMIN'
    if (!isAuthor && !isAdmin) return response.status(403).json({ error: 'You can only delete your own comments' })

    await prisma.comment.delete({ where: { id: comment.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Failed to delete comment:', error)
    response.status(500).json({ error: error.message || 'Failed to delete comment' })
  }
})

// DELETE /:id - Delete post (author or admin only)
router.delete('/:id', requireAuth, async (request, response) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: request.params.id } })
    if (!post) return response.status(404).json({ error: 'Post not found' })

    const isAuthor = post.authorId === request.user.userId
    const isAdmin = request.user.role === 'ADMIN'
    if (!isAuthor && !isAdmin) return response.status(403).json({ error: 'You can only delete your own posts' })

    await prisma.communityPost.delete({ where: { id: post.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Failed to delete post:', error)
    response.status(500).json({ error: error.message || 'Failed to delete post' })
  }
})

// POST /reports - Report a post or comment (auth required)
router.post('/reports', requireAuth, async (request, response) => {
  const { postId, commentId, reason } = request.body
  if (!reason?.trim()) return response.status(400).json({ error: 'Reason is required' })
  if (!postId && !commentId) return response.status(400).json({ error: 'postId or commentId is required' })
  if (postId && commentId) return response.status(400).json({ error: 'Provide only postId or commentId' })

  try {
    if (postId) {
      const post = await prisma.communityPost.findUnique({ where: { id: postId } })
      if (!post) return response.status(404).json({ error: 'Post not found' })
    }
    if (commentId) {
      const comment = await prisma.comment.findUnique({ where: { id: commentId } })
      if (!comment) return response.status(404).json({ error: 'Comment not found' })
    }

    const report = await prisma.report.create({
      data: {
        reason: reason.trim(),
        reporterId: request.user.userId,
        postId: postId || null,
        commentId: commentId || null,
      },
    })

    response.status(201).json({ report })
  } catch (error) {
    console.error('Failed to report content:', error)
    response.status(500).json({ error: error.message || 'Failed to submit report' })
  }
})

export default router