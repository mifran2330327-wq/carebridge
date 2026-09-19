import { useEffect, useMemo, useState } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import SchoolCard from '../../components/SchoolCard/SchoolCard.jsx'
import { schools as fallbackSchools } from '../../data/mockData.js'
import { getDirectory } from '../../lib/api.js'
import { normalizeInstitution } from '../../lib/directory.js'
import './Schools.css'

export default function Schools() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [activeType, setActiveType] = useState(null)
  const [schools, setSchools] = useState(fallbackSchools)

  useEffect(() => {
    getDirectory().then(({ institutions }) => {
      if (institutions.length) setSchools(institutions.map(normalizeInstitution))
    }).catch(() => {})
  }, [])

  const allTypes = [...new Set(schools.map((school) => school.type).filter(Boolean))]

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      const matchesQuery = !query || s.name.toLowerCase().includes(query.toLowerCase())
      const matchesType = !activeType || s.type === activeType
      const matchesLocation = !location || s.location.toLowerCase().includes(location.trim().toLowerCase())
      return matchesQuery && matchesType && matchesLocation
    })
  }, [query, activeType, location, schools])

  return (
    <div className="page directory">
      <div className="container">
        <div className="directory__header">
          <div>
            <h1>Special & Inclusive School Directory</h1>
            <p>Compare schools by type, age range, and available facilities.</p>
          </div>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          location={location}
          onLocationChange={setLocation}
          placeholder="Search school name..."
        />

        <div className="directory__chips">
          <button
            className={`directory__chip ${!activeType ? 'directory__chip--active' : ''}`}
            onClick={() => setActiveType(null)}
          >
            All types
          </button>
          {allTypes.map((t) => (
            <button
              key={t}
              className={`directory__chip ${activeType === t ? 'directory__chip--active' : ''}`}
              onClick={() => setActiveType(t === activeType ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="directory__result-count mono">
          {filtered.length} school{filtered.length !== 1 ? 's' : ''} found
        </div>

        <div className="schools__grid">
          {filtered.map((s) => <SchoolCard key={s.id} school={s} />)}
          {filtered.length === 0 && <p className="directory__empty">No institutions match your filters yet — try clearing them.</p>}
        </div>
      </div>
    </div>
  )
}
