import { Sparkles } from 'lucide-react'
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard.jsx'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import { recommendations, children } from '../../data/mockData.js'
import './Recommendations.css'

export default function Recommendations() {
  return (
    <div className="page recommendations">
      <div className="container">
        <SectionHeading
          eyebrow="AI-powered"
          title="Personalized picks for your children"
          description="Generated from each child’s profile, diagnosis, and past activity — refreshed as you update their profile or book appointments."
        />

        {children.map((child) => {
          const childRecs = recommendations.filter((r) => r.forChild === child.name)
          if (childRecs.length === 0) return null

          return (
            <section className="recommendations__group" key={child.id}>
              <h2 className="recommendations__group-title">
                <Sparkles size={16} /> For {child.name}
              </h2>
              <div className="recommendations__grid">
                {childRecs.map((r) => (
                  <RecommendationCard key={r.id} recommendation={r} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
