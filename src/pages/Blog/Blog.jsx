import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Calendar, Filter, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import { getBlogPosts } from '../../lib/api.js'
import './Blog.css'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    setLoading(true)
    setError(null)

    getBlogPosts({ take: 100 })
      .then(({ posts: published }) => {
        if (Array.isArray(published)) {
          setPosts(published)
        } else {
          setPosts([])
        }
      })
      .catch((err) => {
        console.error('Failed to load blog posts:', err)
        setError('Unable to load blog posts. Please try again.')
        setPosts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const categories = [
    ...new Set(posts.map((p) => p.category).filter(Boolean)),
  ]
  const uniqueCategories = ['all', ...categories]

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === 'all' || post.category === activeCategory
      const matchesSearch =
        !searchQuery ||
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [posts, activeCategory, searchQuery])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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
    if (post.professional?.specialty) parts.push(post.professional.specialty)
    if (post.professional?.isDabMember) parts.push('DAB Member')
    return parts.join(', ') || ''
  }

  return (
    <div className="page blog">
      <div className="container">
        <section className="blog__hero">
          <div>
            <div className="blog__eyebrow">
              <BookOpen size={15} />
              Doctor insights & health guides
            </div>
            <SectionHeading
              title="From our doctors"
              description={`Evidence-based articles and guidance written by verified CareBridge healthcare professionals.`}
            />
          </div>

          <div className="blog__search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {categories.length > 0 && (
          <div className="blog__filter-bar">
            <div className="blog__filter-label">
              <Filter size={15} />
              Category
            </div>
            <div className="blog__chips">
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`blog__chip ${
                    activeCategory === cat ? 'blog__chip--active' : ''
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="blog__state blog__state--loading">
            <div className="blog__spinner" />
            <div>
              <strong>Loading articles</strong>
              <p>Fetching the latest doctor-authored content...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="blog__state blog__state--error" role="alert">
            <strong>Unable to load articles</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredPosts.length > 0 && (
          <div className="blog__grid">
            {filteredPosts.map((post) => (
              <article key={post.id} className="blog__card">
                {post.coverImage && (
                  <div className="blog__card-image">
                    <img src={post.coverImage} alt={post.title} loading="lazy" />
                  </div>
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
                  {!post.excerpt && post.content && (
                    <p className="blog__card-excerpt">
                      {post.content.slice(0, 150)}...
                    </p>
                  )}
                  <div className="blog__card-meta">
                    <div className="blog__author-info">
                      <span className="blog__author-name">
                        {getAuthorName(post)}
                      </span>
                      {getAuthorCredentials(post) && (
                        <span className="blog__author-creds">
                          {getAuthorCredentials(post)}
                        </span>
                      )}
                    </div>
                    <div className="blog__date">
                      <Calendar size={12} />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className="blog__state blog__state--empty">
            <div className="blog__empty-icon">
              <BookOpen size={27} />
            </div>
            <div className="blog__empty-content">
              <h3>No articles found</h3>
              <p>
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Check back soon for new articles from our healthcare professionals.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
