import './Badge.css'

// Small pill label used for tags, categories, verification marks, etc.
// tone: 'brand' | 'accent' | 'neutral' | 'success'
export default function Badge({ children, tone = 'neutral', mono = false }) {
  return (
    <span className={`badge badge--${tone} ${mono ? 'mono' : ''}`}>{children}</span>
  )
}
