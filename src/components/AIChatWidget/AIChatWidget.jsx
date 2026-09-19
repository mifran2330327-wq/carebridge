import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Compass } from 'lucide-react'
import { liteClient } from 'algoliasearch/lite'
import './AIChatWidget.css'

const STARTER_PROMPTS = [
  'Find a speech therapist near me',
  'What is an IEP?',
  'Help me choose a school',
]

const searchClient = liteClient(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY,
)

const INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX || 'carebridge_content'

function routeFor(query, hits) {
  const lowerQuery = query.toLowerCase()

  if (
    hits.some((hit) => hit.category === 'Professional') ||
    /\b(doctor|therapist|speech|psychologist|autism)\b/.test(lowerQuery)
  ) {
    return '/professionals'
  }

  if (
    hits.some((hit) => hit.category === 'Institution') ||
    /\b(school|hospital|institution|center)\b/.test(lowerQuery)
  ) {
    return '/schools'
  }

  if (
    hits.some((hit) => hit.category === 'Resource') ||
    /\b(resource|article|video|guide)\b/.test(lowerQuery)
  ) {
    return '/resources'
  }

  return '/search'
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, from: 'ai', text: "Hi! I'm the CareBridge Guide. Ask me anything about finding support for your child." },
  ])
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  async function handleSend(text) {
    const content = text ?? draft
    if (!content.trim()) return

    const userMsg = { id: Date.now(), from: 'user', text: content }
    setMessages((prev) => [...prev, userMsg])
    setDraft('')

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

      const hits = results[0]?.hits || []
      const route = routeFor(content, hits)
      const reply = hits.length
        ? `I found ${hits.length} relevant ${hits.length === 1 ? 'result' : 'results'}. You can start here:`
        : 'I could not find an exact match. Try a specialty, location, school, hospital, or resource name.'

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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'ai',
          text: 'The search service is unavailable. Please try again later.',
        },
      ])
    }
  }

  return (
    <div className="ai-widget">
      {open && (
        <div className="ai-widget__panel">
          <div className="ai-widget__header">
            <div className="ai-widget__header-title">
              <Compass size={18} />
              CareBridge Guide
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
                  <a
                    key={`${m.id}-${hit.objectID}`}
                    className="ai-widget__hit"
                    href={hit.url || m.route || '/search'}
                  >
                    <strong>{hit.title}</strong>
                    <span>
                      {[hit.category, hit.specialty, hit.location]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </a>
                ))}
              </div>
            ))}
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
              placeholder="Ask the guide..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" aria-label="Send">
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
