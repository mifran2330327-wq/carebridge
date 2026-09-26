import { useEffect, useMemo, useState } from 'react'
import { Plus, Filter, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import Button from '../../components/Button/Button.jsx'
import { getCommunityPosts, getLookups } from '../../lib/api.js'
import './Community.css'

export default function Community() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [activeSpecialty, setActiveSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ total: 0, take: 20, skip: 0 })
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    getLookups().then(({ specialties: specs }) => setSpecialties(specs)).catch(() => {})
  }, [])

  async function loadPosts() {
    setLoading(true)
    try {
      const data = await getCommunityPosts({
        specialty: activeSpecialty,
        take: pagination.take,
        skip: pagination.skip,
      })
      setPosts(data.posts)
      setPagination((prev) => ({ ...prev, total: data.pagination.total }))
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [activeSpecialty, pagination.skip])

  function handlePageChange(newSkip) {
    setPagination((prev) => ({ ...prev, skip: newSkip }))
  }

  function handleCreatePost() {
    if (!user) {
      navigate('/login', { state: { from: '/community/new' } })
      return
    }
    navigate('/community/new')
  }

  const pageCount = Math.ceil(pagination.total / pagination.take)

  return (
    <div className="page community">
      <div className="container community__layout">
        <div className="community__main">
          <div className="community__header">
            <div>
              <h1>Parent Community Forum</h1>
              <p>Ask questions, share what worked, and connect with parents nearby.</p>
            </div>
            <Button variant="primary" icon={Plus} onClick={handleCreatePost}>New post</Button>
          </div>

          <div className="community__filters">
            <div className="community__filter-group">
              <Filter size={14} />
              <select
                className="community__specialty"
                value={activeSpecialty}
                onChange={(e) => { setActiveSpecialty(e.target.value); setPagination((p) => ({ ...p, skip: 0 })) }}
              >
                <option value="">All specialties</option>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="community__sort">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="community__sort-select">
                <option value="recent">Most recent</option>
                <option value="active">Most active</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="community__loading"><Loader2 size={24} className="spin" /> Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="community__empty">
              <p>No posts yet. Be the first to start a discussion!</p>
              <Button variant="primary" icon={Plus} onClick={handleCreatePost} className="mt-4">Create first post</Button>
            </div>
          ) : (
            <>
              <div className="community__list">
                {posts.map((post) => (
                  <article key={post.id} className="forum-card">
                    <div className="forum-card__avatar mono">
                      {post.author.name[0]}
                    </div>
                    <div className="forum-card__body">
                      <div className="forum-card__meta">
                        <span className="forum-card__author">{post.author.name}</span>
                        <span className="forum-card__dot">·</span>
                        <span className="forum-card__time mono">{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.specialty && (
                          <Badge tone="brand" className="forum-card__specialty">{post.specialty.name}</Badge>
                        )}
                        {post.isAnonymous && <Badge tone="neutral" className="forum-card__anonymous">Anonymous</Badge>}
                      </div>
                      <Link to={`/community/${post.id}`} className="forum-card__title-link">
                        <h3 className="forum-card__title">{post.title}</h3>
                      </Link>
                      <div className="forum-card__footer">
                        <span className="forum-card__replies">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {post._count.comments} replies
                        </span>
                        <span className="forum-card__reactions">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          {post._count.reactions}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {pageCount > 1 && (
                <div className="community__pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(0, pagination.skip - pagination.take))}
                    disabled={pagination.skip === 0}
                  >
                    Previous
                  </Button>
                  <span className="community__page-info">
                    Page {Math.floor(pagination.skip / pagination.take) + 1} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.skip + pagination.take)}
                    disabled={pagination.skip + pagination.take >= pagination.total}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="community__sidebar">
          <div className="community__sidebar-card">
            <h3>Community guidelines</h3>
            <ul>
              <li>Be respectful — everyone here is figuring things out too.</li>
              <li>No medical claims — share experience, not diagnoses.</li>
              <li>Protect privacy — avoid sharing your child's full name or school.</li>
            </ul>
          </div>
          <div className="community__sidebar-card">
            <h3>Popular topics</h3>
            <div className="community__tags">
              {specialties.slice(0, 10).map((s) => <span key={s.id}>{s.name}</span>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}