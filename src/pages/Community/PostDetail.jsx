import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, MessageCircle, Heart, Flag, Trash2, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  getCommunityPost,
  addCommunityComment,
  toggleCommunityReaction,
  deleteCommunityPost,
  reportCommunityContent,
  getSession,
} from '../../lib/api.js'
import Button from '../../components/Button/Button.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import './PostDetail.css'

// Delete a comment via API
async function deleteComment(commentId) {
  const session = getSession()
  const r = await fetch(`/api/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session?.token || ''}` },
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error(d.error || 'Failed to delete comment')
  }
}

export default function PostDetail() {
  const { postId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentForm, setCommentForm] = useState({ body: '', isAnonymous: false })
  const [submittingComment, setSubmittingComment] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reporting, setReporting] = useState({ post: false, commentId: null })
  const [reportReason, setReportReason] = useState('')

  async function loadPost() {
    setLoading(true)
    try {
      const data = await getCommunityPost(postId)
      setPost(data.post)
      setComments(data.post.comments || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPost() }, [postId])

  async function handleAddComment(e) {
    e.preventDefault()
    setError('')
    if (!commentForm.body.trim()) return
    setSubmittingComment(true)
    try {
      const { comment } = await addCommunityComment(postId, commentForm)
      setComments((prev) => [...prev, comment])
      setCommentForm({ body: '', isAnonymous: false })
      setPost((prev) => prev ? { ...prev, _count: { ...prev._count, comments: (prev._count?.comments || 0) + 1 } } : prev)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleToggleReaction() {
    if (!user) { navigate('/login', { state: { from: `/community/${postId}` } }); return }
    try {
      const { reacted } = await toggleCommunityReaction(postId)
      setPost((prev) => ({
        ...prev,
        _count: { ...prev._count, reactions: prev._count.reactions + (reacted ? 1 : -1) },
        userReacted: reacted,
      }))
    } catch (err) { setError(err.message) }
  }

  async function handleDeletePost() {
    if (!window.confirm('Delete this post permanently?')) return
    try {
      await deleteCommunityPost(postId)
      setSuccess('Post deleted.')
      setTimeout(() => navigate('/community'), 800)
    } catch (err) { setError(err.message) }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setPost((prev) => prev ? { ...prev, _count: { ...prev._count, comments: Math.max(0, (prev._count?.comments || 1) - 1) } } : prev)
    } catch (err) { setError(err.message) }
  }

  async function submitReport(e) {
    e.preventDefault()
    if (!reportReason.trim()) return
    try {
      if (reporting.post) {
        await reportCommunityContent({ postId, reason: reportReason })
      } else {
        await reportCommunityContent({ commentId: reporting.commentId, reason: reportReason })
      }
      setSuccess('Report submitted. Thank you.')
      setReporting({ post: false, commentId: null })
      setReportReason('')
    } catch (err) { setError(err.message) }
  }

  if (loading) return <div className="page post-detail"><div className="container post-detail__loading"><Loader2 size={24} className="spin" /> Loading...</div></div>
  if (!post) return (
    <div className="page post-detail">
      <div className="container post-detail__not-found">
        <h2>Post not found</h2>
        {error && <p className="post-detail__message post-detail__message--error">{error}</p>}
        <Link to="/community"><Button variant="primary">Back to forum</Button></Link>
      </div>
    </div>
  )

  const isAuthor = user?.id === post.author?.id || user?.userId === post.author?.id
  const isAdmin = user?.role === 'ADMIN'
  const canDeletePost = isAuthor || isAdmin

  return (
    <div className="page post-detail">
      <div className="container post-detail__layout">
        <div className="post-detail__main">
          <div className="post-detail__header">
            <Link to="/community" className="post-detail__back">
              <ArrowLeft size={18} /> Back to forum
            </Link>
          </div>

          <article className="post-detail__post">
            <header className="post-detail__post-header">
              <div className="post-detail__post-meta">
                <span className="post-detail__author">{post.author?.name || 'Anonymous'}</span>
                <span className="post-detail__dot">·</span>
                <span className="post-detail__time mono">{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.specialty && <Badge tone="brand">{post.specialty.name}</Badge>}
                {post.isAnonymous && <Badge tone="neutral">Anonymous</Badge>}
              </div>
            </header>
            <h1 className="post-detail__title">{post.title}</h1>
            <div className="post-detail__body" style={{ whiteSpace: 'pre-wrap' }}>{post.body}</div>

            <footer className="post-detail__post-footer">
              <button
                className={`post-detail__reaction ${post.userReacted ? 'post-detail__reaction--active' : ''}`}
                onClick={handleToggleReaction}
              >
                <Heart size={18} /> <span>{post._count?.reactions || 0}</span> {post.userReacted ? 'Liked' : 'Like'}
              </button>
              <span className="post-detail__comments-count">
                <MessageCircle size={16} /> {post._count?.comments || 0} comments
              </span>

              {/* Delete post — author or admin */}
              {canDeletePost && (
                <button className="post-detail__delete" onClick={handleDeletePost} title="Delete post">
                  <Trash2 size={16} /> Delete post
                </button>
              )}

              {/* Report post — logged-in users who are NOT the author */}
              {user && !isAuthor && (
                <button
                  className="post-detail__report-btn"
                  onClick={() => setReporting({ post: true, commentId: null })}
                  title="Report post"
                >
                  <Flag size={16} /> Report
                </button>
              )}
            </footer>
          </article>

          {error && <div className="post-detail__message post-detail__message--error" role="alert">{error}</div>}
          {success && <div className="post-detail__message post-detail__message--success" role="status">{success}</div>}

          {/* Report modal */}
          {(reporting.post || reporting.commentId) && (
            <div className="post-detail__report-modal">
              <form onSubmit={submitReport}>
                <h3>Report {reporting.post ? 'post' : 'comment'}</h3>
                <textarea
                  placeholder="Why are you reporting this?"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  rows={3}
                />
                <div className="post-detail__report-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setReporting({ post: false, commentId: null })}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Submit report</button>
                </div>
              </form>
            </div>
          )}

          {/* Comments section */}
          <section className="post-detail__comments">
            <h2>Comments ({post._count?.comments || 0})</h2>

            {user ? (
              <form className="post-detail__comment-form" onSubmit={handleAddComment}>
                <textarea
                  placeholder="Write a comment..."
                  value={commentForm.body}
                  onChange={(e) => setCommentForm((f) => ({ ...f, body: e.target.value }))}
                  required
                  rows={3}
                />
                <div className="post-detail__comment-options">
                  <label className="post-detail__comment-anonymous">
                    <input
                      type="checkbox"
                      checked={commentForm.isAnonymous}
                      onChange={(e) => setCommentForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
                    />
                    Post anonymously
                  </label>
                  <Button type="submit" variant="primary" size="sm" disabled={submittingComment}>
                    {submittingComment ? <><Loader2 size={14} className="spin" /> Posting...</> : 'Post comment'}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="post-detail__login-prompt">
                <Link to="/login" state={{ from: `/community/${postId}` }}>Log in</Link> to join the discussion.
              </p>
            )}

            <div className="post-detail__comments-list">
              {comments.length === 0 && <p className="post-detail__no-comments">No comments yet. Be the first!</p>}
              {comments.map((comment) => {
                const commentIsAuthor = user?.id === comment.author?.id || user?.userId === comment.author?.id
                const canDeleteComment = commentIsAuthor || isAdmin
                return (
                  <article key={comment.id} className="post-detail__comment">
                    <header className="post-detail__comment-header">
                      <span className="post-detail__comment-author">{comment.author?.name || 'Anonymous'}</span>
                      {comment.isExpertReply && (
                        <Badge tone="success" className="post-detail__expert-badge">
                          <ShieldAlert size={12} /> Verified Professional
                        </Badge>
                      )}
                      <span className="post-detail__comment-time mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {comment.isAnonymous && <Badge tone="neutral">Anonymous</Badge>}
                    </header>
                    <div className="post-detail__comment-body">{comment.body}</div>
                    <footer className="post-detail__comment-footer">
                      {/* Delete comment */}
                      {canDeleteComment && (
                        <button
                          className="post-detail__comment-delete"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Delete comment"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                      {/* Report comment — others only */}
                      {user && !commentIsAuthor && (
                        <button
                          className="post-detail__comment-report"
                          onClick={() => setReporting({ post: false, commentId: comment.id })}
                          title="Report comment"
                        >
                          <Flag size={14} /> Report
                        </button>
                      )}
                    </footer>
                    {reporting.commentId === comment.id && (
                      <form className="post-detail__comment-report-form" onSubmit={submitReport}>
                        <textarea
                          placeholder="Why are you reporting this comment?"
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          required
                          rows={2}
                        />
                        <div className="post-detail__report-actions">
                          <button type="button" className="btn btn--ghost" onClick={() => setReporting({ post: false, commentId: null })}>Cancel</button>
                          <button type="submit" className="btn btn--primary">Submit</button>
                        </div>
                      </form>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}