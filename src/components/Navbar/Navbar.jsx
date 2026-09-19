import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Menu, X, HeartHandshake, UserCircle, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx'
import Button from '../Button/Button.jsx'
import './Navbar.css'

// Primary links shown across the app. Kept in one array so mobile + desktop
// menus always stay in sync.
const LINKS = [
  { to: '/professionals', label: 'Therapists' },
  { to: '/schools', label: 'Schools' },
  { to: '/search', label: 'Smart Search' },
  { to: '/resources', label: 'Resources' },
  { to: '/community', label: 'Community' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { signOut(); setAccountOpen(false); navigate('/') }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <span className="navbar__logo">
            <HeartHandshake size={20} />
          </span>
          CareBridge
        </Link>

        <nav className={`navbar__links ${open ? 'navbar__links--open' : ''}`}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Shown inside the dropdown on mobile only */}
          <div className="navbar__mobile-actions">
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="navbar__mobile-btn">
                Log in
              </Button>
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              <Button variant="primary" size="sm" className="navbar__mobile-btn">
                My Dashboard
              </Button>
            </Link>
          </div>
        </nav>

        <div className="navbar__actions">
          <ThemeToggle />
          {user ? <div className="navbar__account">
            <button className="navbar__account-toggle" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen}>
              <UserCircle size={20} /> <span>{user.name.split(' ')[0]}</span>
            </button>
            {accountOpen && <div className="navbar__account-menu">
              <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setAccountOpen(false)}>{user.role === 'ADMIN' ? <ShieldCheck size={15} /> : <UserCircle size={15} />} {user.role === 'ADMIN' ? 'Admin panel' : 'Dashboard'}</Link>
              <button onClick={handleLogout}><LogOut size={15} /> Log out</button>
            </div>}
          </div> : <>
            <Link to="/login" className="navbar__link-desktop"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/dashboard" className="navbar__link-desktop"><Button variant="primary" size="sm">My Dashboard</Button></Link>
          </>}

          <button
            className="navbar__burger"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
