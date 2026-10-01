import { useEffect, useState } from 'react'
import {
  Plus,
  Filter,
  Loader2,
  MessageCircle,
  Heart,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ThumbsUp,
} from 'lucide-react'
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
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    total: 0,
    take: 20,
    skip: 0,
  })
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    getLookups()
      .then(({ specialties: specs }) => setSpecialties(specs || []))
      .catch(() => {})
  }, [])

  async function loadPosts() {
    setLoading(true)
    setError('')

    try {
      const data = await getCommunityPosts({
        specialty: activeSpecialty,
        take: pagination.take,
        skip: pagination.skip,
      })

      let nextPosts = Array.isArray(data.posts) ? data.posts : []

      if (sort === 'active') {
        nextPosts = [...nextPosts].sort(
          (a, b) =>
            (b._count?.comments || 0) +
            (b._count?.reactions || 0) -
            ((a._count?.comments || 0) +
              (a._count?.reactions || 0)),
        )
      }

      setPosts(nextPosts)

      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
      }))
    } catch (loadError) {
      console.error('Failed to load posts:', loadError)
      setError('Unable to load community posts. Please try again.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [activeSpecialty, pagination.skip, sort])

  function handlePageChange(newSkip) {
    setPagination((prev) => ({
      ...prev,
      skip: newSkip,
    }))
  }

  function handleSpecialtyChange(event) {
    setActiveSpecialty(event.target.value)

    setPagination((prev) => ({
      ...prev,
      skip: 0,
    }))
  }

  function handleSortChange(event) {
    setSort(event.target.value)

    setPagination((prev) => ({
      ...prev,
      skip: 0,
    }))
  }

  function handleCreatePost() {
    if (!user) {
      navigate('/login', {
        state: { from: '/community/new' },
      })
      return
    }

    navigate('/community/new')
  }

  const pageCount = Math.ceil(
    pagination.total / pagination.take,
  )

  const currentPage =
    Math.floor(pagination.skip / pagination.take) + 1

  return (
    <div className="page community">
      <div className="container">

        {/* HERO */}
        <section className="community__hero">
          <div className="community__hero-content">
            <div className="community__eyebrow">
              <Users size={15} />
              Parent support community
            </div>

            <SectionHeading
              title="Connect, ask, and share"
              description="A supportive space for parents and caregivers to exchange experiences, practical ideas, and helpful resources."
            />
          </div>

          <div className="community__hero-action">
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreatePost}
            >
              New post
            </Button>


            <p>
              {user
                ? 'Start a conversation with the community.'
                : 'Sign in to create a discussion.'}
            </p>
          </div>
        </section>

        {/* MAIN LAYOUT */}
        <div className="community__layout">

          <main className="community__main">

            {/* FILTER BAR */}
            <section className="community__filters">

              <div className="community__filter-title">
                <div className="community__filter-icon">
                  <Filter size={15} />
                </div>

                <div>
                  <strong>Browse discussions</strong>
                  <span>
                    Find conversations by specialty or activity.
                  </span>
                </div>
              </div>

              <div className="community__filter-controls">

                <label className="community__select-wrap">
                  <span>Specialty</span>

                  <select
                    className="community__specialty"
                    value={activeSpecialty}
                    onChange={handleSpecialtyChange}
                  >
                    <option value="">
                      All specialties
                    </option>

                    {specialties.map((specialty) => (
                      <option
                        key={specialty.id}
                        value={specialty.id}
                      >
                        {specialty.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="community__select-wrap">
                  <span>Sort</span>

                  <select
                    value={sort}
                    onChange={handleSortChange}
                    className="community__sort-select"
                  >
                    <option value="recent">
                      Most recent
                    </option>
                    <option value="active">
                      Most active
                    </option>
                  </select>
                </label>

              </div>
            </section>

            {/* RESULT META */}
            {!loading && !error && (
              <div className="community__result-meta">
                <span>
                  <strong>{pagination.total}</strong>{' '}
                  {pagination.total === 1
                    ? 'discussion'
                    : 'discussions'}
                </span>

                {activeSpecialty && (
                  <button
                    type="button"
                    className="community__clear-filter"
                    onClick={() => {
                      setActiveSpecialty('')
                      setPagination((prev) => ({
                        ...prev,
                        skip: 0,
                      }))
                    }}
                  >
                    Clear specialty
                  </button>
                )}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div
                className="community__state community__state--error"
                role="alert"
              >
                <strong>Something went wrong</strong>
                <p>{error}</p>

                <button
                  type="button"
                  onClick={loadPosts}
                >
                  Try again
                </button>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="community__state community__state--loading">
                <Loader2
                  size={24}
                  className="community__spinner"
                />

                <div>
                  <strong>Loading discussions</strong>
                  <p>
                    Fetching the latest community posts...
                  </p>
                </div>
              </div>
            )}

            {/* POSTS */}
            {!loading && !error && posts.length > 0 && (
              <>
                <div className="community__list">
                  {posts.map((post) => {
                    const authorName =
                      post.author?.name || 'Community member'

                    const initials = authorName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()

                    const comments =
                      post._count?.comments || 0

                    const reactions =
                      post._count?.reactions || 0

                    return (
                      <article
                        key={post.id}
                        className="forum-card"
                      >
                        <div className="forum-card__avatar mono">
                          {initials || 'C'}
                        </div>

                        <div className="forum-card__body">

                          <div className="forum-card__meta">
                            <span className="forum-card__author">
                              {authorName}
                            </span>

                            <span className="forum-card__dot">
                              ·
                            </span>

                            <time className="forum-card__time">
                              {new Date(
                                post.createdAt,
                              ).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                },
                              )}
                            </time>

                            {post.specialty && (
                              <Badge
                                tone="brand"
                                className="forum-card__specialty"
                              >
                                {post.specialty.name}
                              </Badge>
                            )}

                            {post.isAnonymous && (
                              <Badge
                                tone="neutral"
                                className="forum-card__anonymous"
                              >
                                Anonymous
                              </Badge>
                            )}
                          </div>

                          <Link
                            to={`/community/${post.id}`}
                            className="forum-card__title-link"
                          >
                            <h3 className="forum-card__title">
                              {post.title}
                            </h3>
                          </Link>

                          <div className="forum-card__footer">

                            <span className="forum-card__stat">
                              <MessageCircle size={14} />
                              {comments}{' '}
                              {comments === 1
                                ? 'reply'
                                : 'replies'}
                            </span>

                            <span className="forum-card__stat">
                              <Heart size={14} />
                              {reactions}
                            </span>

                            <span className="forum-card__helpful">
                              <ThumbsUp size={14} />{' '}
                              {post._count?.helpfuls || 0}{' '}
                              found this helpful
                            </span>

                            <span className="forum-card__read">
                              Read discussion →
                            </span>

                          </div>

                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* PAGINATION */}
                {pageCount > 1 && (
                  <div className="community__pagination">

                    <Button
                      variant="outline"
                      size="sm"
                      icon={ChevronLeft}
                      onClick={() =>
                        handlePageChange(
                          Math.max(
                            0,
                            pagination.skip -
                              pagination.take,
                          ),
                        )
                      }
                      disabled={pagination.skip === 0}
                    >
                      Previous
                    </Button>

                    <span className="community__page-info">
                      Page {currentPage} of {pageCount}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(
                          pagination.skip +
                            pagination.take,
                        )
                      }
                      disabled={
                        pagination.skip +
                          pagination.take >=
                        pagination.total
                      }
                    >
                      Next
                      <ChevronRight size={15} />
                    </Button>

                  </div>
                )}
              </>
            )}

            {/* EMPTY */}
            {!loading && !error && posts.length === 0 && (
              <div className="community__empty">

                <div className="community__empty-icon">
                  <MessageCircle size={28} />
                </div>

                <div className="community__empty-content">
                  <h3>No discussions found</h3>

                  <p>
                    There are no discussions matching your
                    current filter. Start the first
                    conversation or try another specialty.
                  </p>

                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={handleCreatePost}
                  >
                    Create a post
                  </Button>
                </div>

              </div>
            )}

          </main>

          {/* SIDEBAR */}
          <aside className="community__sidebar">

            <div className="community__sidebar-card community__guidelines">

              <div className="community__sidebar-heading">
                <div className="community__sidebar-icon">
                  <Sparkles size={15} />
                </div>

                <h3>Community guidelines</h3>
              </div>

              <ul>
                <li>
                  Be respectful — everyone is learning and
                  figuring things out.
                </li>

                <li>
                  Share experiences rather than presenting
                  them as medical diagnoses.
                </li>

                <li>
                  Protect privacy — avoid sharing your
                  child&apos;s full name, school, or other
                  identifying details.
                </li>
              </ul>

            </div>

            <div className="community__sidebar-card">

              <div className="community__sidebar-heading">
                <h3>Popular topics</h3>
              </div>

              {specialties.length > 0 ? (
                <div className="community__tags">
                  {specialties
                    .slice(0, 10)
                    .map((specialty) => (
                      <button
                        type="button"
                        key={specialty.id}
                        onClick={() => {
                          setActiveSpecialty(
                            specialty.id,
                          )

                          setPagination((prev) => ({
                            ...prev,
                            skip: 0,
                          }))
                        }}
                      >
                        {specialty.name}
                      </button>
                    ))}
                </div>
              ) : (
                <p className="community__sidebar-muted">
                  Topics will appear here as community
                  specialties become available.
                </p>
              )}

            </div>

            <div className="community__sidebar-card community__join-card">

              <div className="community__join-icon">
                <MessageCircle size={19} />
              </div>

              <h3>Have something to share?</h3>

              <p>
                Ask a question, share an experience, or
                start a helpful conversation.
              </p>

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleCreatePost}
              >
                Start discussion
              </Button>

            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}