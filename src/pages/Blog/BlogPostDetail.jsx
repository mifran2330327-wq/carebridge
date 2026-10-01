import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  Share2,
  User,
  Award,
} from 'lucide-react'
import { getBlogPost } from '../../lib/api.js'
import Badge from '../../components/Badge/Badge.jsx'
import './BlogPostDetail.css'

export default function BlogPostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getBlogPost(id)
      .then(({ post: data }) => {
        setPost(data)
      })
      .catch((err) => {
        console.error('Failed to load blog post:', err)
        setError(err.message || 'Failed to load article')
        setPost(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getAuthorName = (post) => {
    if (post.professional?.name) return post.professional.name
    return post.author?.name || 'Anonymous'
  }

  const getAuthorCredentials = (post) => {
    const parts = []
    if (post.professional?.qualification) parts.push(post.professional.qualification)
    if (post.professional?.degreeNames && post.professional.degreeNames.length > 0) {
      parts.push(post.professional.degreeNames.join(', '))
    }
    if (post.professional?.specialty) parts.push(post.professional.specialty)
    if (post.professional?.isDabMember) parts.push('DAB Member')
    return parts.join(', ') || ''
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'CareBridge Article',
        text: post?.excerpt || '',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const calculateReadTime = (content) => {
    if (!content) return 1
    const wordsPerMinute = 200
    const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  if (loading) {
    return (
      <div className="page blog-post-detail">
        <div className="container">
          <div className="blog-post-detail__loading">
            <Loader2 size={32} className="spin" />
            <p>Loading article...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="page blog-post-detail">
        <div className="container">
          <div className="blog-post-detail__error">
            <h2>Article not found</h2>
            {error && <p>{error}</p>}
            <Link to="/blog">
              <button className="btn btn--primary">Back to articles</button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const readTime = calculateReadTime(post.content)
  const authorName = getAuthorName(post)
  const authorCredentials = getAuthorCredentials(post)

  return (
    <div className="page blog-post-detail">
      <div className="container">
        <div className="blog-post-detail__back">
          <Link to="/blog">
            <ArrowLeft size={18} />
            Back to articles
          </Link>
        </div>

        <article className="blog-post-detail__article">
          {post.coverImage && (
            <div className="blog-post-detail__cover">
              <img src={post.coverImage} alt={post.title} />
            </div>
          )}

          <header className="blog-post-detail__header">
            {post.category && (
              <Badge tone="brand" className="blog-post-detail__category">
                {post.category}
              </Badge>
            )}

            <h1 className="blog-post-detail__title">{post.title}</h1>

            {post.excerpt && (
              <p className="blog-post-detail__excerpt">{post.excerpt}</p>
            )}
          </header>

          <div className="blog-post-detail__author-bar">
            <div className="blog-post-detail__author-info">
              {post.professional?.photo ? (
                <img
                  src={post.professional.photo}
                  alt={authorName}
                  className="blog-post-detail__author-photo"
                />
              ) : (
                <div className="blog-post-detail__author-placeholder">
                  <User size={24} />
                </div>
              )}
              <div>
                <span className="blog-post-detail__author-label">Written by</span>
                <div className="blog-post-detail__author-name">
                  {authorName}
                </div>
                {authorCredentials && (
                  <div className="blog-post-detail__author-credential">
                    <Award size={12} />
                    {authorCredentials}
                  </div>
                )}
              </div>
            </div>

            <div className="blog-post-detail__meta">
              <div className="blog-post-detail__meta-item">
                <Calendar size={14} />
                <span>
                  Published: {formatDate(post.publishedAt || post.createdAt)}
                </span>
              </div>

              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <div className="blog-post-detail__meta-item">
                  <Clock size={14} />
                  <span>Updated: {formatDate(post.updatedAt)}</span>
                </div>
              )}

              <div className="blog-post-detail__meta-item">
                <Clock size={14} />
                <span>
                  {readTime} min read
                </span>
              </div>
            </div>
          </div>

          <div
            className="blog-post-detail__content"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {post.content}
          </div>

          {post.references && (
            <div className="blog-post-detail__references">
              <h3>References</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{post.references}</p>
            </div>
          )}
        </article>

        <footer className="blog-post-detail__footer">
          <button
            className="blog-post-detail__share-btn"
            onClick={handleShare}
          >
            <Share2 size={14} />
            Share article
          </button>

          <Link to="/blog">
            <button className="btn btn--ghost">More articles</button>
          </Link>
        </footer>
      </div>
    </div>
  )
}
