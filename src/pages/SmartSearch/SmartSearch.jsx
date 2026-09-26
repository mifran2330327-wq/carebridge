import { useEffect, useState } from 'react'
import { ListFilter } from 'lucide-react'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import MapPanel from '../../components/MapPanel/MapPanel.jsx'
import ProfessionalCard from '../../components/ProfessionalCard/ProfessionalCard.jsx'
import SchoolCard from '../../components/SchoolCard/SchoolCard.jsx'
import { getDirectory } from '../../lib/api.js'
import { normalizeInstitution, normalizeProfessional } from '../../lib/directory.js'
import './SmartSearch.css'

const TABS = [
  { id: 'professionals', label: 'Professionals' },
  { id: 'schools', label: 'Schools' },
]

export default function SmartSearch() {
  const [tab, setTab] = useState('professionals')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [directory, setDirectory] = useState({ professionals: [], schools: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDirectory()
      .then(({ professionals: providerRows, institutions }) => {
        const professionals = (providerRows || []).map(normalizeProfessional)
        const schools = (institutions || []).map(normalizeInstitution)
        setDirectory({
          professionals,
          schools,
        })
      })
      .catch((err) => {
        console.error('Failed to load search data from database:', err)
        setError('Unable to load database directory. Please check the server connection.')
      })
      .finally(() => setLoading(false))
  }, [])

  const source = tab === 'professionals' ? directory.professionals : directory.schools

  const filteredResults = source.filter((item) => {
    const haystack = [
      item.name,
      item.role,
      item.type,
      item.location,
      item.specialties?.join(' '),
      item.facilities?.join(' '),
      item.visitingDays,
      item.chamber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesQuery = !query || haystack.includes(query.trim().toLowerCase())
    const matchesLocation = !location || (item.location && item.location.toLowerCase().includes(location.trim().toLowerCase()))

    return matchesQuery && matchesLocation
  })

  return (
    <div className="page smart-search">
      <div className="container">
        <div className="smart-search__header">
          <h1>Smart Search</h1>
          <p>Search doctors, therapists, and schools from the database plotted on the map.</p>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          location={location}
          onLocationChange={setLocation}
          placeholder={tab === 'professionals' ? "Search doctor name, specialty, or hospital..." : "Search school or care center..."}
          onFilterClick={() => {}}
        />

        <div className="smart-search__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`smart-search__tab ${tab === t.id ? 'smart-search__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <span className="smart-search__count mono">
            <ListFilter size={14} /> {filteredResults.length} database results
          </span>
        </div>

        {error && <div className="smart-search__error" role="alert">{error}</div>}
        {loading && <div className="smart-search__loading">Loading database directory...</div>}

        <div className="smart-search__layout">
          <div className="smart-search__results">
            {filteredResults.length > 0 ? (
              filteredResults.map((item) =>
                tab === 'professionals' ? (
                  <ProfessionalCard key={item.id} professional={item} />
                ) : (
                  <SchoolCard key={item.id} school={item} />
                ),
              )
            ) : !loading ? (
              <div className="smart-search__empty">No database entries match your search criteria.</div>
            ) : null}
          </div>
          <div className="smart-search__map">
            <MapPanel places={filteredResults} />
          </div>
        </div>
      </div>
    </div>
  )
}
