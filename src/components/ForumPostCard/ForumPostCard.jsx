import { MessageCircle } from 'lucide-react'
import Badge from '../Badge/Badge.jsx'
import './ForumPostCard.css'

// One discussion thread preview in the Parent Community Forum.
export default function ForumPostCard({ post }) {
  const { author, childContext, title, replies, lastActive, tag } = post

  return (
    <article className="forum-card">
      <div className="forum-card__avatar mono">{author[0]}</div>

      <div className="forum-card__body">
        <div className="forum-card__meta">
          <span className="forum-card__author">{author}</span>
          <span className="forum-card__dot">·</span>
          <span className="forum-card__context">{childContext}</span>
        </div>
        <h3 className="forum-card__title">{title}</h3>
        <div className="forum-card__footer">
          <Badge tone="neutral">{tag}</Badge>
          <span className="forum-card__replies">
            <MessageCircle size={14} /> {replies} replies
          </span>
          <span className="forum-card__time mono">{lastActive}</span>
        </div>
      </div>
    </article>
  )
}
