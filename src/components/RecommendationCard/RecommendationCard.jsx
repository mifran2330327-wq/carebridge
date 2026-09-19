import { Sparkles } from 'lucide-react'
import Badge from '../Badge/Badge.jsx'
import './RecommendationCard.css'

// One AI-generated suggestion (professional / school / resource) tied to a child.
export default function RecommendationCard({ recommendation }) {
  const { forChild, type, title, reason } = recommendation

  return (
    <article className="rec-card">
      <div className="rec-card__icon">
        <Sparkles size={16} />
      </div>
      <div className="rec-card__body">
        <div className="rec-card__top">
          <Badge tone="accent">{type}</Badge>
          <span className="rec-card__for mono">for {forChild}</span>
        </div>
        <h3 className="rec-card__title">{title}</h3>
        <p className="rec-card__reason">{reason}</p>
      </div>
    </article>
  )
}
