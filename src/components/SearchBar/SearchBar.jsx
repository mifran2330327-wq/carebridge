import { Search, MapPin, SlidersHorizontal } from 'lucide-react'
import './SearchBar.css'

export default function SearchBar({
  placeholder = 'Search therapists, schools, or conditions...',
  value,
  onChange,
  location,
  onLocationChange,
  onFilterClick,
  onSearch,
  compact = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.(value || '', location || '')
  }

  return (
    <form
      className={`search-bar ${compact ? 'search-bar--compact' : ''}`}
      onSubmit={handleSubmit}
    >
      <div className="search-bar__field search-bar__field--main">
        <Search size={18} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>

      <div className="search-bar__divider" />

      <div className="search-bar__field search-bar__field--location">
        <MapPin size={18} />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => onLocationChange?.(e.target.value)}
        />
      </div>

      {onFilterClick && (
        <button
          type="button"
          className="search-bar__filter"
          onClick={onFilterClick}
          aria-label="Filters"
        >
          <SlidersHorizontal size={17} />
        </button>
      )}

      <button type="submit" className="search-bar__submit" aria-label="Search">
        <Search size={17} />
      </button>
    </form>
  )
}
