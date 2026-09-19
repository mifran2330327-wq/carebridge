import { useEffect, useMemo, useState } from 'react'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import ResourceCard from '../../components/ResourceCard/ResourceCard.jsx'
import { resources } from '../../data/mockData.js'
import { getResources } from '../../lib/api.js'
import './Resources.css'

export default function Resources() {
  const [items, setItems] = useState(resources)
  const [activeType, setActiveType] = useState(null)
  const [activeSpecialty, setActiveSpecialty] = useState('')
  const [video, setVideo] = useState(null)

  useEffect(() => { getResources().then(({ resources: published }) => { if (published.length) setItems(published) }).catch(() => {}) }, [])
  const types = [...new Set(items.map((resource) => resource.type || resource.category || 'ARTICLE'))]
  const specialties = [...new Set(items.flatMap((resource) => (resource.specialties || []).map((entry) => entry.specialty?.name || entry)))]

  const filtered = useMemo(
    () => items.filter((resource) => (!activeType || (resource.type || resource.category) === activeType) && (!activeSpecialty || (resource.specialties || []).some((entry) => (entry.specialty?.name || entry) === activeSpecialty))),
    [activeType, activeSpecialty, items],
  )

  return (
    <div className="page resources">
      <div className="container">
        <SectionHeading
          eyebrow="Educational content library"
          title="Practical guidance, written for parents"
          description="Articles on education, health, and daily life — written to be read between appointments, not academic papers."
        />

        <div className="resources__chips">
          <button
            className={`resources__chip ${!activeType ? 'resources__chip--active' : ''}`}
            onClick={() => setActiveType(null)}
          >
            All
          </button>
          {types.map((c) => (
            <button
              key={c}
              className={`resources__chip ${activeType === c ? 'resources__chip--active' : ''}`}
              onClick={() => setActiveType(c === activeType ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <select className="resources__specialty" value={activeSpecialty} onChange={(event) => setActiveSpecialty(event.target.value)}><option value="">All specialties</option>{specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}</select>

        <div className="resources__grid">
            {filtered.map((r) => (
            <ResourceCard key={r.id} resource={{ ...r, category: r.category || 'Blog', excerpt: r.excerpt || r.content?.slice(0, 150) }} onPlay={setVideo} />
          ))}
        </div>
        {video && <div className="resources__video-modal" role="dialog" aria-modal="true"><button type="button" onClick={() => setVideo(null)}>Close</button><iframe title={video.title} src={`https://www.youtube.com/embed/${video.externalUrl.includes('youtu.be/') ? video.externalUrl.split('youtu.be/')[1].split('?')[0] : new URL(video.externalUrl).searchParams.get('v')}`} allowFullScreen /></div>}
      </div>
    </div>
  )
}
