import { MapPin, Users, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../Badge/Badge.jsx'
import Button from '../Button/Button.jsx'
import './SchoolCard.css'

// Displays one school/center in the School Directory.
export default function SchoolCard({ school }) {
  const { id, name, type, location, distanceKm, ageRange, facilities = [], verificationStatus, averageRating, reviewCount } = school

  function renderStars() {
    const avg = averageRating || 0
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={13}
        className={i < Math.round(avg) ? 'school-card__star--filled' : 'school-card__star--empty'}
      />
    ))
  }

  return (
    <article className="school-card">
      <div className="school-card__header">
        <div>
          <h3 className="school-card__name">{name}</h3>
          <p className="school-card__type">{type}</p>
        </div>
      </div>

      <div className="school-card__meta">
        <span><MapPin size={14} /> {location} <span className="mono">· {distanceKm} km</span></span>
        <span><Users size={14} /> Ages {ageRange}</span>
      </div>

      <div className="school-card__facilities">
        {facilities.map((f) => (
          <Badge key={f} tone="neutral">{f}</Badge>
        ))}
      </div>
      {verificationStatus && <Badge tone={verificationStatus === 'VERIFIED' ? 'brand' : 'neutral'}>{verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending verification'}</Badge>}

      <div className="school-card__bottom">
        <div className="school-card__rating">
          <div className="school-card__stars">{renderStars()}</div>
          {reviewCount > 0 ? (
            <span className="school-card__rating-text">{averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
          ) : (
            <span className="school-card__no-reviews">No reviews yet</span>
          )}
        </div>
        <Link to={`/institutions/${id}`} className="school-card__btn-link">
          <Button size="sm" variant="outline" className="school-card__btn">View profile</Button>
        </Link>
      </div>
    </article>
  )
}
