import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, X, Send, Compass } from 'lucide-react'
import { liteClient } from 'algoliasearch/lite'
import { getDirectory, getResources } from '../../lib/api.js'
import './AIChatWidget.css'

const STARTER_PROMPTS = [
  'Find a doctor for autism in Dhaka',
  'Special schools in Dhaka',
  'Autism video guides and research',
]

const APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || '7Z3M9BN7IU'
const SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '9567c164815d20ea39214b0b130d26e9'
const INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX || 'carebridge_content'

const searchClient = liteClient(APP_ID, SEARCH_KEY)

function routeFor(query, hits) {
  const lowerQuery = query.toLowerCase()

  if (
    hits.some((hit) => hit.category === 'Professional') ||
    /\b(doctor|neurologist|therapist|speech|psychologist|physician)\b/.test(lowerQuery)
  ) {
    return '/professionals'
  }

  if (
    hits.some((hit) => hit.category === 'Institution') ||
    /\b(school|hospital|institution|center|centre|inclusive)\b/.test(lowerQuery)
  ) {
    return '/schools'
  }

  if (
    hits.some((hit) => hit.category === 'Resource') ||
    /\b(resource|article|video|guide|research)\b/.test(lowerQuery)
  ) {
    return '/resources'
  }

  return '/search'
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'ai',
      text: "Hi! I'm your CareBridge AI Guide, connected to our database and search index. Ask me about doctors, special schools, or resources for your child.",
    },
  ])
  const [draft, setDraft] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const listRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  async function searchFallback(content) {
    const lower = content.toLowerCase()
    const [dirData, resData] = await Promise.all([
      getDirectory().catch(() => ({ professionals: [], institutions: [] })),
      getResources({ take: 30 }).catch(() => ({ resources: [] })),
    ])

    const matches = []

    for (const doc of dirData.professionals || []) {
      const text = `${doc.name} ${doc.specialty} ${doc.location || ''} ${doc.chamber || ''}`.toLowerCase()
      if (text.includes(lower) || lower.includes('doctor') || lower.includes('neurolog')) {
        matches.push({
          objectID: `doc_${doc.id}`,
          title: doc.name,
          category: 'Professional',
          specialty: doc.specialty,
          location: doc.location || doc.chamber || 'Dhaka',
          url: '/professionals',
        })
      }
      if (matches.length >= 4) break
    }

    if (matches.length < 4) {
      for (const inst of dirData.institutions || []) {
        const text = `${inst.name} ${inst.district || ''} ${inst.area || ''} ${inst.type || ''}`.toLowerCase()
        if (text.includes(lower) || lower.includes('school') || lower.includes('center')) {
          matches.push({
            objectID: `inst_${inst.id}`,
            title: inst.name,
            category: 'Institution',
            specialty: inst.type || 'Special Education',
            location: inst.district || inst.area || 'Dhaka',
            url: '/schools',
          })
        }
        if (matches.length >= 4) break
      }
    }

    if (matches.length < 4) {
      for (const res of resData.resources || []) {
        const text = `${res.title} ${res.summary}`.toLowerCase()
        if (text.includes(lower) || lower.includes('resource') || lower.includes('video') || lower.includes('article')) {
          matches.push({
            objectID: `res_${res.id}`,
            title: res.title,
            category: 'Resource',
            specialty: res.type === 'VIDEO' ? 'Video Guide' : 'Article',
            location: res.sourceName || 'CareBridge Library',
            url: '/resources',
          })
        }
        if (matches.length >= 4) break
      }
    }

    return matches
  }

  async function handleSend(text) {
    const content = text ?? draft
    if (!content.trim()) return

    const userMsg = { id: Date.now(), from: 'user', text: content }
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setIsSearching(true)

    try {
      let hits = []
      try {
        const { results } = await searchClient.search([
          {
            indexName: INDEX_NAME,
            params: {
              query: content,
              hitsPerPage: 5,
              attributesToRetrieve: [
                'title',
                'description',
                'category',
                'specialty',
                'location',
                'url',
              ],
            },
          },
        ])
        hits = results[0]?.hits || []
      } catch (algoliaErr) {
        console.warn('Algolia search encountered error, trying database fallback:', algoliaErr)
      }

      if (hits.length === 0) {
        // Fallback to database query
        hits = await searchFallback(content)
      }

      const route = routeFor(content, hits)
      const reply = hits.length
        ? `Found ${hits.length} database ${hits.length === 1 ? 'result' : 'results'} matching "${content}":`
        : `I could not find an exact match for "${content}". Try searching by condition (e.g. "autism"), profession ("doctor"), or location ("Dhaka").`

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'ai',
          text: reply,
          hits,
          route,
        },
      ])
    } catch (err) {
      console.error('Search error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'ai',
          text: 'The search service is momentarily reconnecting. Please try again shortly.',
        },
      ])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="ai-widget">
      {open && (
        <div className="ai-widget__panel">
          <div className="ai-widget__header">
            <div className="ai-widget__header-title">
              <Compass size={18} />
              CareBridge AI Guide
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close guide">
              <X size={18} />
            </button>
          </div>

          <div className="ai-widget__messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`ai-widget__bubble ai-widget__bubble--${m.from}`}>
                {m.text}

                {m.hits?.map((hit) => (
                  <div
                    key={`${m.id}-${hit.objectID}`}
                    className="ai-widget__hit"
                    onClick={() => {
                      setOpen(false)
                      navigate(hit.url || m.route || '/search')
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <strong>{hit.title}</strong>
                    <span>
                      {[hit.category, hit.specialty, hit.location]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {isSearching && (
              <div className="ai-widget__bubble ai-widget__bubble--ai">
                <em>Searching database & index...</em>
              </div>
            )}
          </div>

          {messages.length < 3 && (
            <div className="ai-widget__prompts">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} onClick={() => handleSend(p)} className="ai-widget__prompt-chip">
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            className="ai-widget__input-row"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <input
              type="text"
              placeholder="Ask the AI guide..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" aria-label="Send" disabled={isSearching}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button className="ai-widget__fab" onClick={() => setOpen((o) => !o)} aria-label="Open AI guide">
        <Sparkles size={22} />
      </button>
    </div>
  )
}
