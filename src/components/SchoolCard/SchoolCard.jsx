import { MapPin, Users } from 'lucide-react'
import Badge from '../Badge/Badge.jsx'
import Button from '../Button/Button.jsx'
import './SchoolCard.css'

// Displays one school/center in the School Directory.
export default function SchoolCard({ school }) {
  const { name, type, location, distanceKm, ageRange, facilities = [], verificationStatus } = school

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

      <Button size="sm" variant="outline" className="school-card__btn">View profile</Button>
    </article>
  )
}
