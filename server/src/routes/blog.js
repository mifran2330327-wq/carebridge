import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const DEFAULT_PAGE_SIZE = 20

function parsePagination(query) {
  const take = Math.min(Math.max(parseInt(query.take || '20', 10), 1), 100)
  const skip = Math.max(parseInt(query.skip || '0', 10), 0)
  return { take, skip }
}

function formatBlogPost(post) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    coverImage: post.coverImage,
    references: post.references,
    status: post.status,
    publishedAt: post.publishedAt,
    author: post.author
      ? { id: post.author.id, name: post.author.name }
      : null,
    professional: post.professional
      ? {
          id: post.professional.id,
          name: post.professional.name,
          specialty: post.professional.specialty,
          qualification: post.professional.qualification,
          isDabMember: post.professional.isDabMember,
          dabSerial: post.professional.dabSerial,
          verificationStatus: post.professional.verificationStatus,
          photo: post.professional.photo,
          degrees: post.professional.degrees
            ? post.professional.degrees.map((d) => d.degree?.name).filter(Boolean)
            : [],
          specialties: post.professional.specialties
            ? post.professional.specialties.map((s) => s.specialty?.name).filter(Boolean)
            : [],
        }
      : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

// GET /my-posts - Get current doctor's blog posts (DOCTOR only)
// Must be registered BEFORE GET /:id to prevent /my-posts being captured as :id
router.get('/my-posts', requireAuth, async (request, response) => {
  if (request.user.role !== 'DOCTOR') {
    return response.status(403).json({ error: 'Doctor access required' })
  }
  try {
    const professional = await prisma.professional.findUnique({
      where: { ownerId: request.user.userId },
    })
    const where = professional ? { professionalId: professional.id } : { authorId: request.user.userId }
    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })
    response.json({ posts })
  } catch (error) {
    console.error('Failed to get my blog posts:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch your blog posts' })
  }
})

// GET /:id - Get single blog post (public for published, author/admin for others)
router.get('/:id', async (request, response) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
      include: {
        author: { select: { id: true, name: true } },
        professional: {
          include: {
            degrees: { include: { degree: true } },
            specialties: { include: { specialty: true } },
          },
        },
      },
    })
    if (!post) return response.status(404).json({ error: 'Blog post not found' })
    if (post.status === 'DRAFT' && post.authorId !== request.user?.userId && request.user?.role !== 'ADMIN') {
      return response.status(404).json({ error: 'Blog post not found' })
    }
    response.json({ post: formatBlogPost(post) })
  } catch (error) {
    console.error('Failed to get blog post:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch blog post' })
  }
})

// GET / - List published blog posts (public)
router.get('/', async (request, response) => {
  try {
    const { take, skip } = parsePagination(request.query)
    const { category, authorId } = request.query
    const where = {
      status: 'PUBLISHED',
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(authorId ? { authorId } : {}),
    }
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          professional: {
            include: {
              degrees: { include: { degree: true } },
              specialties: { include: { specialty: true } },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take,
        skip,
      }),
      prisma.blogPost.count({ where }),
    ])
    response.json({
      posts: posts.map(formatBlogPost),
      pagination: { total, take, skip },
    })
  } catch (error) {
    console.error('Failed to get blog posts:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch blog posts' })
  }
})

// POST / - Create a blog post (DOCTOR only)
router.post('/', requireAuth, async (request, response) => {
  if (request.user.role !== 'DOCTOR') {
    return response.status(403).json({ error: 'Only doctors can create blog posts' })
  }
  try {
    const { title, content, excerpt, category, coverImage, references, status } = request.body || {}
    if (!title?.trim()) return response.status(400).json({ error: 'Title is required' })
    if (!content?.trim()) return response.status(400).json({ error: 'Content is required' })

    const professional = await prisma.professional.findUnique({
      where: { ownerId: request.user.userId },
    })

    const isPublished = status === 'PUBLISHED'
    const blogPost = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        category: category?.trim() || 'Blog',
        coverImage: coverImage?.trim() || null,
        references: references?.trim() || null,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublished ? new Date() : null,
        authorId: request.user.userId,
        professionalId: professional?.id || null,
      },
    })
    response.status(201).json({ post: formatBlogPost(blogPost) })
  } catch (error) {
    console.error('Failed to create blog post:', error)
    response.status(500).json({ error: error.message || 'Failed to create blog post' })
  }
})

// PATCH /:id - Update a blog post (author only for own drafts, admin for any)
router.patch('/:id', requireAuth, async (request, response) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
    })
    if (!post) return response.status(404).json({ error: 'Blog post not found' })

    const isAdmin = request.user.role === 'ADMIN'
    const isAuthor = post.authorId === request.user.userId

    if (!isAdmin && !isAuthor) {
      return response.status(403).json({ error: 'You can only edit your own blog posts' })
    }

    const { title, content, excerpt, category, coverImage, references, status } = request.body || {}

    const data = {}
    if (title !== undefined) data.title = title.trim()
    if (content !== undefined) data.content = content.trim()
    if (excerpt !== undefined) data.excerpt = excerpt?.trim() || null
    if (category !== undefined) data.category = category?.trim() || 'Blog'
    if (coverImage !== undefined) data.coverImage = coverImage?.trim() || null
    if (references !== undefined) data.references = references?.trim() || null
    if (status !== undefined && isAdmin) {
      data.status = status
      if (status === 'PUBLISHED' && !post.publishedAt) {
        data.publishedAt = new Date()
      }
      if (status === 'DRAFT' || status === 'REJECTED') {
        data.publishedAt = null
      }
    }

    const updated = await prisma.blogPost.update({
      where: { id: request.params.id },
      data,
      include: {
        author: { select: { id: true, name: true } },
        professional: {
          include: {
            degrees: { include: { degree: true } },
            specialties: { include: { specialty: true } },
          },
        },
      },
    })
    response.json({ post: formatBlogPost(updated) })
  } catch (error) {
    console.error('Failed to update blog post:', error)
    response.status(500).json({ error: error.message || 'Failed to update blog post' })
  }
})

// DELETE /:id - Delete a blog post (author or admin)
router.delete('/:id', requireAuth, async (request, response) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
    })
    if (!post) return response.status(404).json({ error: 'Blog post not found' })

    const isAdmin = request.user.role === 'ADMIN'
    const isAuthor = post.authorId === request.user.userId

    if (!isAdmin && !isAuthor) {
      return response.status(403).json({ error: 'You can only delete your own blog posts' })
    }

    await prisma.blogPost.delete({ where: { id: request.params.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Failed to delete blog post:', error)
    response.status(500).json({ error: error.message || 'Failed to delete blog post' })
  }
})

// POST /:id/publish - Publish or unpublish a blog post (author)
router.post('/:id/publish', requireAuth, async (request, response) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
    })
    if (!post) return response.status(404).json({ error: 'Blog post not found' })

    const isAdmin = request.user.role === 'ADMIN'
    const isAuthor = post.authorId === request.user.userId
    if (!isAdmin && !isAuthor) {
      return response.status(403).json({ error: 'You can only publish your own blog posts' })
    }

    const { action } = request.body || {}
    const isPublish = action === 'publish'

    const updated = await prisma.blogPost.update({
      where: { id: request.params.id },
      data: {
        status: isPublish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublish && !post.publishedAt ? new Date() : isPublish ? post.publishedAt : null,
      },
      include: {
        author: { select: { id: true, name: true } },
        professional: {
          include: {
            degrees: { include: { degree: true } },
            specialties: { include: { specialty: true } },
          },
        },
      },
    })
    response.json({ post: formatBlogPost(updated) })
  } catch (error) {
    console.error('Failed to update blog post status:', error)
    response.status(500).json({ error: error.message || 'Failed to update blog post' })
  }
})

export default router
