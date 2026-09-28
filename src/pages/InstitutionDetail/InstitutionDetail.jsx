import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, MapPin, Globe, Mail, Phone, Star } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getInstitution, submitReview } from '../../lib/api.js'
import { normalizeInstitution } from '../../lib/directory.js'
import Button from '../../components/Button/Button.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import './InstitutionDetail.css'

const STAR_VALUES = [1, 2, 3, 4, 5]

export default function InstitutionDetail() {
  const { institutionId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [institution, setInstitution] = useState(null)
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [userReview, setUserReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [hoverRating, setHoverRating] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  async function loadInstitution() {
    setLoading(true)
    setError('')
    setSubmitError('')
    setSubmitSuccess('')
    try {
      const data = await getInstitution(institutionId)
      const normalized = normalizeInstitution(data.institution)
      setInstitution(normalized)
      setReviews(data.reviews || [])
      setAverageRating(data.averageRating || 0)
      setReviewCount(data.reviewCount || 0)
      setUserReview(data.userReview || null)
      if (data.userReview) {
        setReviewForm({ rating: data.userReview.rating, comment: data.userReview.comment || '' })
      } else {
        setReviewForm({ rating: 0, comment: '' })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitution()
  }, [institutionId])

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: `/institutions/${institutionId}` } })
      return
    }
    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setSubmitError('Please select a rating from 1 to 5 stars.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')
    try {
      const { review } = await submitReview(institutionId, { rating: reviewForm.rating, comment: reviewForm.comment })
      const updatedReviews = reviews.find((r) => r.user.id === user.id)
        ? reviews.map((r) => (r.user.id === user.id ? { ...review, user: { id: user.id, name: user.name } } : r))
        : [{ ...review, user: { id: user.id, name: user.name } }, ...reviews]
      const newAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / (updatedReviews.length || 1)
      setReviews(updatedReviews)
      setReviewCount(updatedReviews.length)
      setAverageRating(newAvg)
      setUserReview(review)
      setSubmitSuccess('Your review has been saved!')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function renderStars(rating) {
    return STAR_VALUES.map((i) => (
      <Star
        key={i}
        size={16}
        className={i <= rating ? 'institution-detail__star--filled' : 'institution-detail__star--empty'}
      />
    ))
  }

  function renderInteractiveStars() {
    return STAR_VALUES.map((i) => (
      <button
        key={i}
        type="button"
        className={`institution-detail__star-btn ${i <= (hoverRating || reviewForm.rating) ? 'institution-detail__star--filled' : 'institution-detail__star--empty'}`}
        onMouseEnter={() => setHoverRating(i)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => setReviewForm((prev) => ({ ...prev, rating: i }))}
        title={`Rate ${i} star${i !== 1 ? 's' : ''}`}
      >
        <Star size={18} />
      </button>
    ))
  }

  if (loading) return <div className="page institution-detail"><div className="container institution-detail__loading"><Loader2 size={24} className="spin" /> Loading...</div></div>
  if (!institution) return (
    <div className="page institution-detail">
      <div className="container institution-detail__not-found">
        <h2>Institution not found</h2>
        {error && <p className="institution-detail__message institution-detail__message--error">{error}</p>}
        <Link to="/schools"><Button variant="primary">Back to schools</Button></Link>
      </div>
    </div>
  )

  return (
    <div className="page institution-detail">
      <div className="container institution-detail__layout">
        <div className="institution-detail__main">
          <div className="institution-detail__header">
            <Link to="/schools" className="institution-detail__back">
              <ArrowLeft size={18} /> Back to schools
            </Link>
          </div>

          <article className="institution-detail__card">
            <header className="institution-detail__card-header">
              <h1 className="institution-detail__name">{institution.name}</h1>
              {institution.verificationStatus && (
                <Badge tone={institution.verificationStatus === 'VERIFIED' ? 'brand' : 'neutral'}>
                  {institution.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending verification'}
                </Badge>
              )}
            </header>

            <div className="institution-detail__info">
              {institution.type && <p><strong>Type:</strong> {institution.type}</p>}
              {(institution.ownership || institution.status) && <p><strong>Ownership / Status:</strong> {institution.ownership} {institution.status && `· ${institution.status}`}</p>}
              {institution.address && (
                <p><MapPin size={14} /> <strong>Address:</strong> {institution.address} {institution.district && `(${institution.district})`}</p>
              )}
              {institution.ageRange && <p><strong>Age Range:</strong> {institution.ageRange}</p>}
              {institution.email && <p><Mail size={14} /> <strong>Email:</strong> {institution.email}</p>}
              {institution.website && <p><Globe size={14} /> <strong>Website:</strong> <a href={institution.website} target="_blank" rel="noopener noreferrer">{institution.website}</a></p>}
            </div>

            <footer className="institution-detail__card-footer">
              <div className="institution-detail__rating-summary">
                <div className="institution-detail__rating-stars">{renderStars(Math.round(averageRating))}</div>
                <strong className="institution-detail__rating-score">{averageRating.toFixed(1)}</strong>
                <span className="institution-detail__rating-count">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
              </div>
            </footer>
          </article>

          {error && <p className="institution-detail__message institution-detail__message--error" role="alert">{error}</p>}
          {submitError && <p className="institution-detail__message institution-detail__message--error" role="alert">{submitError}</p>}
          {submitSuccess && <p className="institution-detail__message institution-detail__message--success" role="status">{submitSuccess}</p>}

          <section className="institution-detail__reviews">
            <h2>Reviews ({reviewCount})</h2>

            {user ? (
              <form className="institution-detail__review-form" onSubmit={handleSubmitReview}>
                <div className="institution-detail__form-group">
                  <label>Your rating *</label>
                  <div className="institution-detail__star-input">
                    {renderInteractiveStars()}
                  </div>
                  {userReview && <p className="institution-detail__existing-review-note">You previously rated this {userReview.rating} star(s). Editing your review below.</p>}
                </div>
                <div className="institution-detail__form-group">
                  <label htmlFor="review-comment">Comment (optional)</label>
                  <textarea
                    id="review-comment"
                    placeholder="Share your experience with this institution..."
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} className="spin" /> Saving...</> : (userReview ? 'Update review' : 'Submit review')}
                </Button>
              </form>
            ) : (
              <p className="institution-detail__login-prompt">
                <Link to="/login" state={{ from: `/institutions/${institutionId}` }}>Log in</Link> to write a review.
              </p>
            )}

            <div className="institution-detail__review-list">
              {reviews.length === 0 && <p className="institution-detail__no-reviews">No reviews yet. Be the first to share your experience!</p>}
              {reviews.map((review) => (
                <article key={review.id} className="institution-detail__review">
                  <header className="institution-detail__review-header">
                    <div className="institution-detail__review-stars">{renderStars(review.rating)}</div>
                    <span className="institution-detail__reviewer">{review.user?.name || 'Anonymous'}</span>
                    <span className="mono institution-detail__review-time">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </header>
                  {review.comment && <div className="institution-detail__review-comment">{review.comment}</div>}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
