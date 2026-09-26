import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getLookups, createCommunityPost } from '../../lib/api.js'
import Button from '../../components/Button/Button.jsx'
import './CreatePost.css'

export default function CreatePost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', body: '', isAnonymous: false, specialtyId: '' })
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getLookups().then(({ specialties: specs }) => setSpecialties(specs || [])).catch(() => {})
  }, [])

  if (!user) {
    return (
      <div className="page create-post">
        <div className="container create-post__card">
          <p>Please log in to create a post.</p>
          <Link to="/login"><Button variant="primary">Log in</Button></Link>
        </div>
      </div>
    )
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required')
      return
    }
    setLoading(true)
    try {
      const { post } = await createCommunityPost({
        title: form.title.trim(),
        body: form.body.trim(),
        isAnonymous: form.isAnonymous,
        specialtyId: form.specialtyId || undefined,
      })
      setSuccess('Post created successfully!')
      setTimeout(() => navigate(`/community/${post.id}`), 800)
    } catch (err) {
      setError(err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page create-post">
      <div className="container create-post__card">
        <div className="create-post__header">
          <button className="create-post__back" onClick={() => navigate('/community')}>
            <ArrowLeft size={18} /> Back to forum
          </button>
        </div>

        <h1>Start a new discussion</h1>
        <p className="create-post__subtitle">Share your experience, ask a question, or offer advice to other parents.</p>

        {error && <div className="create-post__message create-post__message--error" role="alert">{error}</div>}
        {success && <div className="create-post__message create-post__message--success" role="status">{success}</div>}

        <form className="create-post__form" onSubmit={handleSubmit}>
          <div className="create-post__field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="What's on your mind?"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={120}
            />
          </div>

          <div className="create-post__field">
            <label htmlFor="body">Your post</label>
            <textarea
              id="body"
              name="body"
              placeholder="Share your experience, ask a question, or offer advice..."
              value={form.body}
              onChange={handleChange}
              required
              rows={10}
              maxLength={5000}
            />
          </div>

          <div className="create-post__field">
            <label htmlFor="specialty">Specialty / topic (optional)</label>
            <select id="specialty" name="specialtyId" value={form.specialtyId} onChange={handleChange}>
              <option value="">Select a specialty</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <label className="create-post__checkbox">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
            />
            <span>Post anonymously (your name will be hidden)</span>
          </label>

          <div className="create-post__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/community')}>Cancel</button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin" /> Posting...</> : 'Create post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}