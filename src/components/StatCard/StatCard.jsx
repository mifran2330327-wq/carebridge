import './StatCard.css'

// Small metric tile — used on the Home page and Dashboard.
export default function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">
        <Icon size={20} />
      </div>
      <div>
        <p className="stat-card__value mono">{value}</p>
        <p className="stat-card__label">{label}</p>
      </div>
    </div>
  )
}
