import { Search, MapPin, SlidersHorizontal } from 'lucide-react'
import './SearchBar.css'

// Shared search input used on Home + Smart Search + directory pages.
// Purely presentational for now — wire up onSearch when the API exists.
export default function SearchBar({
  placeholder = 'Search therapists, schools, or conditions...',
  value,
  onChange,
  location,
  onLocationChange,
  onFilterClick,
  compact = false,
}) {
  return (
    <div className={`search-bar ${compact ? 'search-bar--compact' : ''}`}>
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
        <button className="search-bar__filter" onClick={onFilterClick} aria-label="Filters">
          <SlidersHorizontal size={17} />
        </button>
      )}
    </div>
  )
}
