import { Link } from 'react-router-dom'
import { HeartHandshake, Facebook, Instagram, Mail } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand-col">
          <Link to="/" className="footer__brand">
            <HeartHandshake size={20} />
            CareBridge
          </Link>
          <p className="footer__tagline">
            One place to find the right therapists, schools, and support for your child.
          </p>
          <div className="footer__socials">
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="Email"><Mail size={18} /></a>
          </div>
        </div>

        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/professionals">Therapists</Link>
          <Link to="/schools">Schools</Link>
          <Link to="/search">Smart Search</Link>
          <Link to="/appointments">Appointments</Link>
        </div>

        <div className="footer__col">
          <h4>Community</h4>
          <Link to="/resources">Resource Library</Link>
          <Link to="/community">Parent Forum</Link>
          <Link to="/recommendations">AI Recommendations</Link>
        </div>

        <div className="footer__col">
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Create account</Link>
          <Link to="/dashboard">My Dashboard</Link>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© 2026 CareBridge. Built for parents, by parents.</p>
      </div>
    </footer>
  )
}
