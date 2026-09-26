import { useEffect, useMemo, useState } from 'react'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import ResourceCard from '../../components/ResourceCard/ResourceCard.jsx'
import { getResources } from '../../lib/api.js'
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
    if (v) return `https://www.youtube.com/embed/${v}`
    const parts = parsed.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last) return `https://www.youtube.com/embed/${last}`
  } catch {}
  return url
}

export default function Resources() {
  const [items, setItems] = useState([])
  const [activeType, setActiveType] = useState(null)
  const [activeSpecialty, setActiveSpecialty] = useState('')
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        setError('Unable to load educational resources. Please verify database connection.')
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  const types = [...new Set(items.map((resource) => resource.type || resource.category).filter(Boolean))]
  const specialties = [
    ...new Set(
      items.flatMap((resource) =>
        (resource.specialties || []).map((entry) => entry.specialty?.name || entry.name || entry)
      ).filter(Boolean)
    ),
  ]

  const filtered = useMemo(
    () =>
      items.filter((resource) => {
        const matchesType = !activeType || (resource.type || resource.category) === activeType
        const resourceSpecialties = (resource.specialties || []).map(
          (entry) => entry.specialty?.name || entry.name || entry
        )
        const matchesSpecialty =
          !activeSpecialty || resourceSpecialties.some((name) => name === activeSpecialty)
        return matchesType && matchesSpecialty
      }),
    [activeType, activeSpecialty, items]
  )

  const videoCount = items.filter((r) => r.type === 'VIDEO').length
  const articleCount = items.filter((r) => r.type === 'ARTICLE').length

  return (
    <div className="page resources">
      <div className="container">
        <SectionHeading
          eyebrow="Educational content library"
          title="Practical guidance & videos for parents"
          description={`Browse ${items.length} verified resources from our database (${articleCount} articles & ${videoCount} curated YouTube video guides).`}
        />

        <div className="resources__chips">
          <button
            className={`resources__chip ${!activeType ? 'directory__chip--active' : ''}`}
            onClick={() => setActiveType(null)}
          >
            All ({items.length})
          </button>
          {types.map((c) => (
            <button
              key={c}
              className={`resources__chip ${activeType === c ? 'resources__chip--active' : ''}`}
              onClick={() => setActiveType(c === activeType ? null : c)}
            >
              {c === 'VIDEO' ? 'Videos' : c === 'ARTICLE' ? 'Articles' : c} (
              {items.filter((r) => (r.type || r.category) === c).length})
            </button>
          ))}
        </div>

        {specialties.length > 0 && (
          <select
            className="resources__specialty"
            value={activeSpecialty}
            onChange={(event) => setActiveSpecialty(event.target.value)}
          >
            <option value="">All specialties ({specialties.length})</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        )}

        {loading && <div className="resources__loading">Loading resources from database...</div>}
        {error && <div className="resources__error" role="alert">{error}</div>}

        <div className="resources__grid">
          {!loading &&
            !error &&
            filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={{
                  ...r,
                  category: r.type === 'VIDEO' ? 'Video Guide' : (r.category || 'Article'),
                  excerpt: r.summary || r.excerpt || r.content?.slice(0, 150),
                }}
                onPlay={setVideo}
              />
            ))}
          {!loading && !error && filtered.length === 0 && (
            <p className="resources__empty">No database resources match your selected filters.</p>
          )}
        </div>

        {video && (
          <div className="resources__video-modal" role="dialog" aria-modal="true">
            <div className="resources__video-container">
              <div className="resources__video-header">
                <h3>{video.title}</h3>
                <button type="button" onClick={() => setVideo(null)}>
                  Close ✕
                </button>
              </div>
              <iframe
                title={video.title}
                src={getYouTubeEmbedUrl(video.externalUrl)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
