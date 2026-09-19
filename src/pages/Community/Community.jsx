import { useState } from 'react'
import { Plus, TrendingUp, Clock } from 'lucide-react'
import ForumPostCard from '../../components/ForumPostCard/ForumPostCard.jsx'
import Button from '../../components/Button/Button.jsx'
import { forumPosts } from '../../data/mockData.js'
import './Community.css'

const SORTS = [
  { id: 'recent', label: 'Most recent', icon: Clock },
  { id: 'active', label: 'Most active', icon: TrendingUp },
]

export default function Community() {
  const [sort, setSort] = useState('recent')

  const sorted = [...forumPosts].sort((a, b) =>
    sort === 'active' ? b.replies - a.replies : 0,
  )

  return (
    <div className="page community">
      <div className="container community__layout">
        <div className="community__main">
          <div className="community__header">
            <div>
              <h1>Parent Community Forum</h1>
              <p>Ask questions, share what worked, and connect with parents nearby.</p>
            </div>
            <Button variant="primary" icon={Plus}>New post</Button>
          </div>

          <div className="community__sort">
            {SORTS.map((s) => (
              <button
                key={s.id}
                className={`community__sort-btn ${sort === s.id ? 'community__sort-btn--active' : ''}`}
                onClick={() => setSort(s.id)}
              >
                <s.icon size={14} /> {s.label}
              </button>
            ))}
          </div>

          <div className="community__list">
            {sorted.map((p) => (
              <ForumPostCard key={p.id} post={p} />
            ))}
          </div>
        </div>

        <aside className="community__sidebar">
          <div className="community__sidebar-card">
            <h3>Community guidelines</h3>
            <ul>
              <li>Be respectful — everyone here is figuring things out too.</li>
              <li>No medical claims — share experience, not diagnoses.</li>
              <li>Protect privacy — avoid sharing your child’s full name or school.</li>
            </ul>
          </div>
          <div className="community__sidebar-card">
            <h3>Popular tags</h3>
            <div className="community__tags">
              <span>Recommendations</span>
              <span>Daily Life</span>
              <span>Education</span>
              <span>ADHD</span>
              <span>Autism</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
