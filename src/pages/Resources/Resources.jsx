import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Filter,
  Play,
  Video,
  FileText,
  X,
  RotateCcw,
  ChevronRight,
  Pen,
} from 'lucide-react'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import ResourceCard from '../../components/ResourceCard/ResourceCard.jsx'
import { getResources, getBlogPosts } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './Resources.css'

function getYouTubeEmbedUrl(url) {
  if (!url) return null

  try {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0].split('/')[0]
      return `https://www.youtube.com/embed/${id}`
    }

    const parsed = new URL(url)
    const v = parsed.searchParams.get('v')

    if (v) {
      return `https://www.youtube.com/embed/${v}`
    }

    const parts = parsed.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]

    if (last) {
      return `https://www.youtube.com/embed/${last}`
    }
  } catch {
    // Keep original URL as fallback.
  }

  return url
}

export default function Resources() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [activeType, setActiveType] = useState(null)
  const [activeSpecialty, setActiveSpecialty] = useState('')
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('resources')
  const [blogPosts, setBlogPosts] = useState([])
  const [blogLoading, setBlogLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getResources({ take: 100 })
      .then(({ resources: published }) => {
        if (Array.isArray(published)) {
          setItems(published)
        } else {
          setItems([])
        }
      })
      .catch((err) => {
        console.error('Failed to load resources from database:', err)
        setError(
          'Unable to load educational resources. Please verify database connection.',
        )
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab === 'blogs') {
      setBlogLoading(true)
      getBlogPosts({ take: 100 })
        .then(({ posts }) => {
          setBlogPosts(Array.isArray(posts) ? posts : [])
        })
        .catch((err) => {
          console.error('Failed to load blog posts:', err)
          setBlogPosts([])
        })
        .finally(() => setBlogLoading(false))
    }
  }, [activeTab])

  const types = [
    ...new Set(
      items
        .map((resource) => resource.type || resource.category)
        .filter(Boolean),
    ),
  ]

  const specialties = [
    ...new Set(
      items
        .flatMap((resource) =>
          (resource.specialties || []).map(
            (entry) =>
              entry.specialty?.name || entry.name || entry,
          ),
        )
        .filter(Boolean),
    ),
  ]

  const filtered = useMemo(
    () =>
      items.filter((resource) => {
        const resourceType = resource.type || resource.category

        const matchesType =
          !activeType || resourceType === activeType

        const resourceSpecialties = (resource.specialties || []).map(
          (entry) =>
            entry.specialty?.name || entry.name || entry,
        )

        const matchesSpecialty =
          !activeSpecialty ||
          resourceSpecialties.some(
            (name) => name === activeSpecialty,
          )

        return matchesType && matchesSpecialty
      }),
    [activeType, activeSpecialty, items],
  )

  const videoCount = items.filter(
    (resource) => resource.type === 'VIDEO',
  ).length

  const articleCount = items.filter(
    (resource) => resource.type === 'ARTICLE',
  ).length

  const clearFilters = () => {
    setActiveType(null)
    setActiveSpecialty('')
  }

  const hasFilters = Boolean(activeType || activeSpecialty)

  return (
    <div className="page resources">
      <div className="container">

        <section className="resources__hero">
          <div className="resources__hero-main">
            <div className="resources__eyebrow">
              <BookOpen size={15} />
              Educational content library
            </div>

            <SectionHeading
              title="Practical guidance & videos for parents"
              description={`Explore ${items.length} resources from the CareBridge library, including ${articleCount} articles and ${videoCount} video guides.`}
            />
          </div>

          <div className="resources__tabs">
            <button
              type="button"
              className={`resources__tab ${activeTab === 'resources' ? 'resources__tab--active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              Library Resources
            </button>
            <button
              type="button"
              className={`resources__tab ${activeTab === 'blogs' ? 'resources__tab--active' : ''}`}
              onClick={() => setActiveTab('blogs')}
            >
              From Our Doctors
            </button>
          </div>

          {activeTab === 'resources' && (
            <div className="resources__hero-stats-box">
              <div className="resources__stat">
                <FileText size={18} />
                <div>
                  <strong>{articleCount}</strong>
                  <span>Articles</span>
                </div>
              </div>

              <div className="resources__stat">
                <Video size={18} />
                <div>
                  <strong>{videoCount}</strong>
                  <span>Videos</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blogs' && user?.role === 'DOCTOR' && (
            <Link to="/blog/new" className="resources__write-blog">
              <Pen size={14} />
              Write a blog post
            </Link>
          )}
        </section>

        {/* BLOG POSTS TAB */}
        {activeTab === 'blogs' && (
          <section className="resources__blog-section">
            {blogLoading && (
              <div className="resources__state resources__state--loading">
                <div className="resources__spinner" />
                <div>
                  <strong>Loading articles</strong>
                  <p>Fetching the latest doctor-authored content...</p>
                </div>
              </div>
            )}

            {!blogLoading && blogPosts.length > 0 && (
              <div className="blog__grid">
                {blogPosts.map((post) => (
                  <article key={post.id} className="blog__card">
                    {post.coverImage && (
                      <Link to={`/blog/${post.id}`} className="blog__card-image-link">
                        <div className="blog__card-image">
                          <img src={post.coverImage} alt={post.title} loading="lazy" />
                        </div>
                      </Link>
                    )}
                    <div className="blog__card-body">
                      {post.category && (
                        <span className="blog__card-category">{post.category}</span>
                      )}
                      <h3 className="blog__card-title">
                        <Link to={`/blog/${post.id}`}>{post.title}</Link>
                      </h3>
                      {post.excerpt && (
                        <p className="blog__card-excerpt">{post.excerpt}</p>
                      )}
                      <div className="blog__card-meta">
                        <span className="blog__author-name">
                          {post.professional?.name || post.author?.name || 'Doctor'}
                        </span>
                        <span className="blog__date">
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!blogLoading && blogPosts.length === 0 && (
              <div className="blog__empty">
                <div className="blog__empty-icon">
                  <BookOpen size={27} />
                </div>
                <div className="blog__empty-content">
                  <h3>No blog posts yet</h3>
                  <p>
                    Our doctors are working on creating educational content.
                    Check back soon!
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <>
            <section className="resources__filters">

          <div className="resources__filter-heading">
            <div>
              <span className="resources__filter-title">
                <Filter size={15} />
                Browse resources
              </span>

              <span className="resources__filter-subtitle">
                Filter the library by content type or specialty.
              </span>
            </div>

            {hasFilters && (
              <button
                type="button"
                className="resources__clear"
                onClick={clearFilters}
              >
                <RotateCcw size={13} />
                Clear filters
              </button>
            )}
          </div>

          <div className="resources__chips">

            <button
              type="button"
              className={`resources__chip ${
                !activeType
                  ? 'resources__chip--active'
                  : ''
              }`}
              onClick={() => setActiveType(null)}
            >
              All
              <span>{items.length}</span>
            </button>

            {types.map((type) => {
              const count = items.filter(
                (resource) =>
                  (resource.type || resource.category) === type,
              ).length

              return (
                <button
                  type="button"
                  key={type}
                  className={`resources__chip ${
                    activeType === type
                      ? 'resources__chip--active'
                      : ''
                  }`}
                  onClick={() =>
                    setActiveType(
                      type === activeType ? null : type,
                    )
                  }
                >
                  {type === 'VIDEO'
                    ? 'Videos'
                    : type === 'ARTICLE'
                      ? 'Articles'
                      : type}

                  <span>{count}</span>
                </button>
              )
            })}
          </div>

          {specialties.length > 0 && (
            <div className="resources__specialty-wrap">
              <label
                htmlFor="resource-specialty"
                className="resources__specialty-label"
              >
                Specialty
              </label>

              <select
                id="resource-specialty"
                className="resources__specialty"
                value={activeSpecialty}
                onChange={(event) =>
                  setActiveSpecialty(event.target.value)
                }
              >
                <option value="">
                  All specialties
                </option>

                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {loading && (
          <div className="resources__state resources__state--loading">
            <div className="resources__spinner" />
            <div>
              <strong>Loading resources</strong>
              <p>Fetching the latest resources from the database...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="resources__state resources__state--error" role="alert">
            <strong>Unable to load resources</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="resources__results-header">
            <div>
              <strong>{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'resource' : 'resources'} found
            </div>

            {hasFilters && (
              <span className="resources__active-filter">
                Filtered results
              </span>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="resources__grid">
            {filtered.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={{
                  ...resource,
                  category:
                    resource.type === 'VIDEO'
                      ? 'Video Guide'
                      : resource.category || 'Article',
                  excerpt:
                    resource.summary ||
                    resource.excerpt ||
                    resource.content?.slice(0, 150),
                }}
                onPlay={setVideo}
              />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="resources__empty">
            <div className="resources__empty-icon">
              <BookOpen size={27} />
            </div>

            <h3>No matching resources</h3>

            <p>
              Try changing your filters to find more educational
              content.
            </p>

            <button
              type="button"
              className="resources__empty-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {video && (
          <div
            className="resources__video-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-video-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setVideo(null)
              }
            }}
          >
            <div className="resources__video-container">

              <div className="resources__video-header">
                <div>
                  <span>Video guide</span>
                  <h3 id="resource-video-title">
                    {video.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  aria-label="Close video"
                  className="resources__video-close"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="resources__video-frame">
                <iframe
                  title={video.title}
                  src={getYouTubeEmbedUrl(video.externalUrl)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

            </div>
          </div>
        )}
        </>
      )}
      </div>
    </div>
  )
}