import { ArrowUpRight, Play } from 'lucide-react'
import Badge from '../Badge/Badge.jsx'
import './ResourceCard.css'

// One article/resource in the Educational Content Library.
export default function ResourceCard({ resource, onPlay }) {
  const { title, type, category, readTime, excerpt, summary, externalUrl, thumbnailUrl, sourceName, specialties = [] } = resource

  return (
    <article className="resource-card">
      <div className="resource-card__top">
        <Badge tone="accent">{type || category}</Badge>
        <span className="resource-card__time mono">{readTime || sourceName || 'CareBridge'}</span>
      </div>
      {thumbnailUrl && <img className="resource-card__thumbnail" src={thumbnailUrl} alt="" />}
      <h3 className="resource-card__title">{title}</h3>
      <p className="resource-card__excerpt">{excerpt || summary}</p>
      <div className="resource-card__tags">{specialties.map((entry) => <Badge key={entry.specialty?.name || entry}>{entry.specialty?.name || entry}</Badge>)}</div>
      {type === 'VIDEO' && externalUrl ? <button type="button" className="resource-card__link" onClick={() => onPlay(resource)}>Watch video <Play size={15} /></button> : externalUrl ? <a href={externalUrl} target="_blank" rel="noreferrer" className="resource-card__link">Open source <ArrowUpRight size={15} /></a> : <span className="resource-card__link">Read article <ArrowUpRight size={15} /></span>}
    </article>
  )
}
