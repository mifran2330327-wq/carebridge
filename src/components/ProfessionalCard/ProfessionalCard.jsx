import { MapPin, BadgeCheck, Calendar } from 'lucide-react'
import Badge from '../Badge/Badge.jsx'
import Button from '../Button/Button.jsx'
import './ProfessionalCard.css'

// Displays one therapist/professional from the directory.
export default function ProfessionalCard({ professional }) {
  const { name, role, specialties = [], degrees = [], location, distanceKm, price, availability, verified, verificationStatus, visitingDays, visitingHours, chamber, phone, onBook } =
    professional

  return (
    <article className="pro-card">
      <div className="pro-card__top">
        <div className="pro-card__avatar mono">{name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
        <div className="pro-card__heading">
          <h3 className="pro-card__name">
            {name}
            {verified && <BadgeCheck size={16} className="pro-card__verified" aria-label="Verified" />}
          </h3>
          <p className="pro-card__role">{role}</p>
        </div>
      </div>

      <div className="pro-card__tags">
        {specialties.map((s) => (
          <Badge key={s} tone="brand">{s}</Badge>
        ))}
      </div>
      {degrees.length > 0 && <div className="pro-card__credentials">Degrees: {degrees.join(', ')}</div>}
      {verificationStatus && <Badge tone={verified ? 'brand' : 'neutral'}>{verified ? 'Verified' : 'Pending verification'}</Badge>}

      <div className="pro-card__meta">
        <span className="pro-card__meta-item">
          <MapPin size={14} /> {location} <span className="mono">· {distanceKm} km</span>
        </span>
      </div>
      {(visitingDays || visitingHours || chamber || phone) && <div className="pro-card__availability-detail">
        {visitingDays && <span>Days: {visitingDays}</span>}
        {visitingHours && <span>Hours: {visitingHours}</span>}
        {chamber && <span>Visits: {chamber}</span>}
        {phone && <span>Book by phone: {phone}</span>}
      </div>}

      <div className="pro-card__footer">
        <div>
          <p className="pro-card__price mono">{price}</p>
          <p className="pro-card__availability">
            <Calendar size={13} /> {availability}
          </p>
        </div>
        {onBook ? <Button size="sm" variant="primary" onClick={() => onBook(professional)}>Book session</Button> : <Button size="sm" variant="primary">Book</Button>}
      </div>
    </article>
  )
}
