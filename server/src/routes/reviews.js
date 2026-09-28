import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function optionalAuth(request, _response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (token) {
    try { request.user = jwt.verify(token, process.env.JWT_SECRET) } catch {}
  }
  next()
}

router.get('/institutions/:id', optionalAuth, async (request, response) => {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: request.params.id },
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    })
    if (!institution) return response.status(404).json({ error: 'Institution not found' })

    const reviews = institution.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      user: { id: r.user.id, name: r.user.name },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    const averageRating = institution.reviews.length > 0
      ? institution.reviews.reduce((sum, r) => sum + r.rating, 0) / institution.reviews.length
      : 0

    const currentUserId = request.user?.userId
    const userReview = reviews.find((r) => r.user.id === currentUserId) || null

    response.json({
      institution: {
        id: institution.id,
        name: institution.name,
        type: institution.type,
        ownership: institution.ownership,
        status: institution.status,
        address: institution.address,
        district: institution.district,
        area: institution.area,
        email: institution.email,
        website: institution.website,
        ageRange: institution.ageRange,
        latitude: institution.latitude,
        longitude: institution.longitude,
        verificationStatus: institution.verificationStatus,
        createdAt: institution.createdAt,
        updatedAt: institution.updatedAt,
      },
      reviews,
      reviewCount: institution._count.reviews,
      averageRating,
      userReview,
    })
  } catch (error) {
    console.error('Failed to get institution:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch institution' })
  }
})

router.post('/institutions/:id/reviews', requireAuth, async (request, response) => {
  const { rating, comment } = request.body || {}
  const ratingNum = parseInt(rating, 10)
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return response.status(400).json({ error: 'Rating must be between 1 and 5' })
  }

  try {
    const institution = await prisma.institution.findUnique({ where: { id: request.params.id } })
    if (!institution) return response.status(404).json({ error: 'Institution not found' })

    const existing = await prisma.review.findUnique({
      where: { userId_institutionId: { userId: request.user.userId, institutionId: institution.id } },
    })

    let review
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating: ratingNum, comment: comment?.trim() || null },
        include: { user: { select: { id: true, name: true } } },
      })
    } else {
      review = await prisma.review.create({
        data: { rating: ratingNum, comment: comment?.trim() || null, userId: request.user.userId, institutionId: institution.id },
        include: { user: { select: { id: true, name: true } } },
      })
    }

    response.status(existing ? 200 : 201).json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user: { id: review.user.id, name: review.user.name },
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to create/update review:', error)
    response.status(500).json({ error: error.message || 'Failed to submit review' })
  }
})

export default router
