import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Save,
  Send,
  Loader2,
  ArrowLeft,
  Image,
  FileText,
  Tag,
  List,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { createBlogPost, updateBlogPost, getBlogPost } from '../../lib/api.js'
import Button from '../../components/Button/Button.jsx'
import './CreateBlogPost.css'

export default function CreateBlogPost({ postId: postIdProp }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const postId = postIdProp || null
  const isEditing = Boolean(postId)

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    coverImage: '',
    references: '',
    status: 'DRAFT',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isEditing) {
      setLoading(true)
      getBlogPost(postId)
        .then(({ post }) => {
          setForm({
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            category: post.category || '',
            coverImage: post.coverImage || '',
            references: post.references || '',
            status: post.status || 'DRAFT',
          })
        })
        .catch((err) => {
          setError(err.message || 'Failed to load post')
        })
        .finally(() => setLoading(false))
    }
  }, [postId, isEditing])

  if (!user) {
    return (
      <div className="page create-blog">
        <div className="container create-blog__card">
          <p>Please log in to create a blog post.</p>
          <Link to="/login">
            <Button variant="primary">Log in</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (user.role !== 'DOCTOR') {
    return (
      <div className="page create-blog">
        <div className="container create-blog__card">
          <h2>Doctor access required</h2>
          <p>Only verified doctors can write blog posts on CareBridge.</p>
          <Link to="/blog">
            <Button variant="primary">Back to articles</Button>
          </Link>
        </div>
      </div>
    )
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e, isPublish = false) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    if (!form.content.trim()) {
      setError('Content is required')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim(),
        category: form.category.trim() || 'Blog',
        coverImage: form.coverImage.trim() || null,
        references: form.references.trim() || null,
        status: isPublish ? 'PUBLISHED' : 'DRAFT',
      }
      if (isEditing) {
        await updateBlogPost(postId, payload)
        setSuccess('Post updated successfully!')
      } else {
        const { post } = await createBlogPost(payload)
        setSuccess('Post created successfully!')
        setTimeout(() => {
          navigate(`/blog/${post.id}`)
        }, 800)
      }
    } catch (err) {
      setError(err.message || 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page create-blog">
        <div className="container create-blog__card">
          <Loader2 size={32} className="spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="page create-blog">
      <div className="container create-blog__layout">
        <div className="create-blog__card">
          <div className="create-blog__header">
            <Link to={isEditing ? `/blog/${postId}` : '/blog'}>
              <ArrowLeft size={18} /> Back to {isEditing ? 'article' : 'articles'}
            </Link>
          </div>

          <h1>{isEditing ? 'Edit Article' : 'Write a New Article'}</h1>
          <p className="create-blog__subtitle">
            Share your medical expertise with the CareBridge community.
          </p>

          {error && <div className="create-blog__message create-blog__message--error" role="alert">{error}</div>}
          {success && <div className="create-blog__message create-blog__message--success" role="status">{success}</div>}

          <form className="create-blog__form" onSubmit={(e) => handleSubmit(e, false)}>
            <div className="create-blog__field">
              <label htmlFor="title">
                <FileText size={14} />
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Enter a compelling title..."
                value={form.title}
                onChange={handleChange}
                required
                maxLength={200}
              />
            </div>

            <div className="create-blog__field">
              <label htmlFor="excerpt">
                <List size={14} />
                Excerpt (short summary)
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                placeholder="A brief summary that appears on the article preview..."
                value={form.excerpt}
                onChange={handleChange}
                rows={3}
                maxLength={300}
              />
            </div>

            <div className="create-blog__field">
              <label htmlFor="content">
                <FileText size={14} />
                Article Content
              </label>
              <textarea
                id="content"
                name="content"
                placeholder="Write your article content here. Use clear headings, bullet points, and plain text formatting."
                value={form.content}
                onChange={handleChange}
                required
                rows={20}
              />
            </div>

            <div className="create-blog__field">
              <label htmlFor="category">
                <Tag size={14} />
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="e.g., Autism, Down Syndrome, Early Intervention..."
                value={form.category}
                onChange={handleChange}
                maxLength={50}
              />
            </div>

            <div className="create-blog__field">
              <label htmlFor="coverImage">
                <Image size={14} />
                Cover Image URL (optional)
              </label>
              <input
                id="coverImage"
                name="coverImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.coverImage}
                onChange={handleChange}
              />
            </div>

            <div className="create-blog__field">
              <label htmlFor="references">
                <List size={14} />
                References / Sources (optional)
              </label>
              <textarea
                id="references"
                name="references"
                placeholder="List your references or sources here..."
                value={form.references}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="create-blog__actions">
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => handleSubmit(e, false)}
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 size={14} className="spin" /> Saving...</>
                ) : (
                  <><Save size={14} /> Save as Draft</>
                )}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 size={14} className="spin" /> Publishing...</>
                ) : (
                  <><Send size={14} /> Publish</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
