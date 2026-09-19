import { Pencil, Trash2 } from 'lucide-react'
import Badge from '../Badge/Badge.jsx'
import './ChildCard.css'

// One child profile card, shown on the Parent Dashboard.
export default function ChildCard({ child, onDelete }) {
  const { name, age, diagnosis, supportLevel, notes } = child

  return (
    <article className="child-card">
      <div className="child-card__header">
        <div className="child-card__avatar mono">{name[0]}</div>
        <div>
          <h3 className="child-card__name">{name}</h3>
          <p className="child-card__age">{age} years old</p>
        </div>
        <button className="child-card__edit" aria-label={`Edit ${name}'s profile`}>
          <Pencil size={15} />
        </button>
        {onDelete && <button className="child-card__edit" aria-label={`Delete ${name}'s profile`} onClick={() => onDelete(child.id)}><Trash2 size={15} /></button>}
      </div>

      <p className="child-card__diagnosis">{diagnosis}</p>
      <Badge tone="brand">{supportLevel}</Badge>
      <p className="child-card__notes">{notes}</p>
    </article>
  )
}
