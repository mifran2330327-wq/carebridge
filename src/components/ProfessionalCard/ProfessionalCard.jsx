import {
  MapPin,
  BadgeCheck,
  Calendar,
  Phone,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Badge from '../Badge/Badge.jsx'
import Button from '../Button/Button.jsx'
import './ProfessionalCard.css'

export default function ProfessionalCard({ professional }) {
  const {
    name,
    role,
    specialties = [],
    degrees = [],
    location,
    distanceKm,
    price,
    availability,
    verified,
    verificationStatus,
    visitingDays,
    visitingHours,
    chamber,
    phone,
    ownerId,
    isDabMember,
    dabSerial,
    onBook,
  } = professional

  const isPlatformUser = Boolean(ownerId)

  const initials =
    name
      ?.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('') || 'PR'

  return (
    <article className="pro-card">

      {/* Header */}
      <div className="pro-card__top">
        <div className="pro-card__avatar mono">
          {initials}
        </div>

        <div className="pro-card__heading">
          <h3 className="pro-card__name">
            {name}

            {verified && (
              <BadgeCheck
                size={16}
                className="pro-card__verified"
                aria-label="Verified professional"
              />
            )}
          </h3>

          <p className="pro-card__role">
            {role}
          </p>
        </div>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="pro-card__tags">
          {specialties.map((specialty) => (
            <Badge
              key={specialty}
              tone="brand"
            >
              {specialty}
            </Badge>
          ))}
        </div>
      )}

      {/* Degrees */}
      {degrees.length > 0 && (
        <div className="pro-card__credentials">
          <strong>Degrees:</strong>{' '}
          {degrees.join(', ')}
        </div>
      )}

      {/* Professional status */}
      <div className="pro-card__badges">

        {isDabMember && (
          <Badge tone="brand">
            DAB Member
            {dabSerial && ` · ${dabSerial}`}
          </Badge>
        )}

        {verificationStatus && (
          <Badge tone={verified ? 'brand' : 'neutral'}>
            {verified
              ? 'Verified Professional'
              : 'Pending Verification'}
          </Badge>
        )}

        <Badge tone={isPlatformUser ? 'success' : 'neutral'}>
          {isPlatformUser
            ? 'CareBridge Booking'
            : 'External Specialist'}
        </Badge>

      </div>

      {/* Location */}
      <div className="pro-card__meta">
        <span className="pro-card__meta-item">
          <MapPin size={14} />

          <span>
            {location}
          </span>

          {distanceKm && distanceKm !== '—' && (
            <span className="mono">
              · {distanceKm} km
            </span>
          )}
        </span>
      </div>

      {/* Practice details */}
      {(visitingDays ||
        visitingHours ||
        chamber ||
        phone) && (
        <div className="pro-card__availability-detail">

          {chamber && (
            <span>
              <strong>Chamber:</strong>{' '}
              {chamber}
            </span>
          )}

          {visitingDays && (
            <span>
              <strong>Visiting Days:</strong>{' '}
              {visitingDays}
            </span>
          )}

          {visitingHours && (
            <span>
              <strong>Visiting Hours:</strong>{' '}
              {visitingHours}
            </span>
          )}

          {phone && (
            <span>
              <strong>Direct Line:</strong>{' '}
              {phone}
            </span>
          )}

        </div>
      )}

      {/* Footer */}
      <div className="pro-card__footer">

        <div className="pro-card__fee">

          <p className="pro-card__price mono">
            {price || 'Contact for fee'}
          </p>

          <p className="pro-card__availability">
            <Calendar size={13} />

            <span>
              {availability || 'By appointment'}
            </span>
          </p>

        </div>

        {/* Actions */}
        <div className="pro-card__actions">

          <Link
            to={`/professionals/${professional.id}`}
            className="pro-card__profile-link"
          >
            <span>View profile</span>
            <ArrowRight size={14} />
          </Link>

          {isPlatformUser && onBook ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onBook(professional)}
            >
              <Calendar size={14} />
              Book session
            </Button>
          ) : phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="pro-card__call-button"
            >
              <Phone size={14} />
              <span>Call doctor</span>
            </a>
          ) : null}

        </div>
      </div>

    </article>
  )
}