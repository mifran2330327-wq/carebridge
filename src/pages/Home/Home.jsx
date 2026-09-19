import { Link } from 'react-router-dom'
import {
  Stethoscope, School, MapPinned, CalendarCheck, BookOpen, MessagesSquare,
  Sparkles, Compass, ArrowRight, Users, ShieldCheck,
} from 'lucide-react'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import Button from '../../components/Button/Button.jsx'
import ProfessionalCard from '../../components/ProfessionalCard/ProfessionalCard.jsx'
import { professionals } from '../../data/mockData.js'
import './Home.css'

// Feature grid content — mirrors the eight key features from the brief.
const FEATURES = [
  { icon: Users, title: 'Parent & Child Profiles', text: 'Keep every child’s diagnosis, needs, and history in one secure profile.' },
  { icon: Stethoscope, title: 'Therapist Directory', text: 'Browse verified professionals filtered by specialty and location.' },
  { icon: School, title: 'School Directory', text: 'Compare special and inclusive schools by facility and age range.' },
  { icon: MapPinned, title: 'Smart Search & Maps', text: 'Find nearby support visually, sorted by distance and availability.' },
  { icon: CalendarCheck, title: 'Appointment Booking', text: 'Book, reschedule, and track sessions from a single calendar.' },
  { icon: BookOpen, title: 'Content Library', text: 'Practical, parent-written articles on education, health, and daily life.' },
  { icon: MessagesSquare, title: 'Community Forum', text: 'Ask questions and share experiences with parents who understand.' },
  { icon: Sparkles, title: 'AI Recommendations', text: 'Personalized suggestions based on your child’s specific needs.' },
]

export default function Home() {
  return (
    <div className="page home">
      {/* ---------------- Hero ---------------- */}
      <section className="home-hero">
        <div className="container home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-hero__eyebrow mono">For parents & caregivers</p>
            <h1 className="home-hero__title">
              Every resource your child needs, finally in one place.
            </h1>
            <p className="home-hero__subtitle">
              CareBridge brings therapists, special schools, educational content, and a
              community of parents together — matched to your child’s needs and your
              neighborhood.
            </p>

            <div className="home-hero__search">
              <SearchBar
                placeholder="Search 'speech therapist', 'autism school'..."
                location="Dhaka"
              />
            </div>

            <div className="home-hero__cta-row">
              <Link to="/signup"><Button variant="accent" icon={ArrowRight}>Get started free</Button></Link>
              <Link to="/professionals"><Button variant="outline">Browse therapists</Button></Link>
            </div>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__card home-hero__card--main">
              <Compass size={26} />
              <p className="home-hero__card-title">AI Virtual Guide</p>
              <p className="home-hero__card-text">
                "Find a speech therapist near Dhanmondi with evening slots."
              </p>
            </div>
            <div className="home-hero__card home-hero__card--float-1">
              <ShieldCheck size={16} />
              <span className="mono">Verified information</span>
            </div>
            <div className="home-hero__card home-hero__card--float-2">
              <ShieldCheck size={16} />
              <span>Verified professionals</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="container home-stats">
        <StatCard icon={Stethoscope} value="850+" label="Verified professionals" />
        <StatCard icon={School} value="210+" label="Listed schools & centers" />
        <StatCard icon={Users} value="12,000+" label="Parents in the community" />
        <StatCard icon={BookOpen} value="300+" label="Educational articles" />
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="container home-section">
        <SectionHeading
          eyebrow="Everything, connected"
          title="One bridge to every kind of support"
          description="No more switching between ten different Facebook groups, directories, and PDFs. CareBridge organizes it all around your child."
        />
        <div className="home-features">
          {FEATURES.map((f) => (
            <div className="home-feature-card" key={f.title}>
              <div className="home-feature-card__icon">
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Featured professionals ---------------- */}
      <section className="container home-section">
        <SectionHeading
          eyebrow="Highly rated"
          title="Meet a few professionals near you"
          description="A sample of verified therapists currently accepting new families in Dhaka."
        />
        <div className="home-pro-grid">
          {professionals.slice(0, 3).map((p) => (
            <ProfessionalCard key={p.id} professional={p} />
          ))}
        </div>
        <div className="home-section__more">
          <Link to="/professionals"><Button variant="outline" icon={ArrowRight}>See all professionals</Button></Link>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container">
        <div className="home-cta">
          <div>
            <h2>Ready to build your child’s support circle?</h2>
            <p>Create a free profile and get personalized recommendations in minutes.</p>
          </div>
          <Link to="/signup"><Button variant="accent" icon={ArrowRight}>Create your profile</Button></Link>
        </div>
      </section>
    </div>
  )
}
