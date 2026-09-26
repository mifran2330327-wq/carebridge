import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard.jsx'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import { getChildren, getDirectory, getResources } from '../../lib/api.js'
import './Recommendations.css'

export default function Recommendations() {
  const [children, setChildren] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getChildren().catch(() => ({ children: [] })),
      getDirectory().catch(() => ({ professionals: [], institutions: [] })),
      getResources({ take: 20 }).catch(() => ({ resources: [] })),
    ])
      .then(([{ children: childRows }, { professionals, institutions }, { resources }]) => {
        const loadedChildren = childRows || []
        setChildren(loadedChildren)

        const recs = []
        loadedChildren.forEach((child) => {
          const childCondition = `${child.supportNeeds || ''} ${child.conditionDescription || ''}`.toLowerCase()
          const keywords = childCondition.split(/[\s,;]+/).filter((k) => k.length > 2)

          // Find doctors in database matching child's condition
          const matchedDocs = (professionals || []).filter((doc) => {
            const docInfo = `${doc.specialty || ''} ${doc.focus || ''} ${doc.name || ''}`.toLowerCase()
            return keywords.some((k) => docInfo.includes(k))
          })

          const docsToRecommend = [
            ...matchedDocs.slice(0, 3),
            ...(professionals || []).filter((p) => !matchedDocs.some((m) => m.id === p.id)).slice(0, 2)
          ]

          docsToRecommend.forEach((doc) => {
            const isMatch = matchedDocs.some((m) => m.id === doc.id)
            recs.push({
              id: `rec-doc-${child.id}-${doc.id}`,
              forChild: child.name,
              type: isMatch ? 'Recommended Doctor from Database (Matched)' : 'Recommended Doctor from Database (General Specialist)',
              title: `${doc.name} — ${doc.specialty || 'Specialist'}`,
              reason: isMatch
                ? `Matched from database for ${child.name}'s diagnosis (${child.supportNeeds || 'special care'}) at ${doc.chamber || doc.location || 'Dhaka'}.`
                : `General child specialist from database recommended for ${child.name} at ${doc.chamber || doc.location || 'Dhaka'}.`,
            })
          })

          // Institutions
          ;(institutions || []).slice(0, 2).forEach((inst) => {
            recs.push({
              id: `rec-inst-${child.id}-${inst.id}`,
              forChild: child.name,
              type: 'School / Institution from Database',
              title: inst.name,
              reason: `Specialized facility in ${inst.district || inst.area || 'Dhaka'} with support programs suitable for ${child.name}.`,
            })
          })

          // Resources
          ;(resources || []).slice(0, 2).forEach((res) => {
            recs.push({
              id: `rec-res-${child.id}-${res.id}`,
              forChild: child.name,
              type: res.type === 'VIDEO' ? 'Database Video Guide' : 'Database Educational Guide',
              title: res.title,
              reason: `Guidance content from database related to ${res.summary?.slice(0, 80) || 'parent education'}.`,
            })
          })
        })

        setRecommendations(recs)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page recommendations">
      <div className="container">
        <SectionHeading
          eyebrow="Database & AI-powered"
          title="Personalized picks for your children"
          description="Generated dynamically from your children's profiles and real database records (doctors, schools, and educational resources)."
        />

        {loading && <p className="recommendations__loading">Loading recommendations from database...</p>}

        {!loading && children.length === 0 && (
          <div className="recommendations__empty">
            <p>You have not added any children profiles yet. Please add a child in your Dashboard to see personalized recommendations.</p>
          </div>
        )}

        {!loading && children.map((child) => {
          const childRecs = recommendations.filter((r) => r.forChild === child.name)
          if (childRecs.length === 0) return null

          return (
            <section className="recommendations__group" key={child.id}>
              <h2 className="recommendations__group-title">
                <Sparkles size={16} /> For {child.name} {child.supportNeeds ? `(${child.supportNeeds})` : ''}
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
