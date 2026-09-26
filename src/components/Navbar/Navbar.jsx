import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, HeartHandshake, UserCircle, LogOut, ShieldCheck, Bell, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx'
import Button from '../Button/Button.jsx'
import { getNotifications } from '../../lib/api.js'
import './Navbar.css'

const AUTH_LINKS = [
  { to: '/professionals', label: 'Therapists' },
  { to: '/schools', label: 'Schools' },
  { to: '/search', label: 'Smart Search' },
  { to: '/resources', label: 'Resources' },
  { to: '/community', label: 'Community' },
]

const GUEST_PAGES = ['/login', '/signup']

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isGuestPage = GUEST_PAGES.includes(location.pathname)

  async function loadNotifications() {
    if (!user) return
    setLoadingNotifications(true)
    try {
      const data = await getNotifications({ take: 10, skip: 0 })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (e) {
      console.error('Failed to load notifications:', e)
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (user) loadNotifications()
    else { setNotifications([]); setUnreadCount(0) }
  }, [user])

  function handleLogout() { signOut(); setAccountOpen(false); navigate('/') }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <span className="navbar__logo"><HeartHandshake size={20} /></span>
          CareBridge
        </Link>

        {/* Nav links — only when logged in AND not on guest page */}
        {user && !isGuestPage && (
          <nav className={`navbar__links ${open ? 'navbar__links--open' : ''}`}>
            {AUTH_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {/* Mobile-only auth actions */}
            <div className="navbar__mobile-actions">
              <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}>
                <Button variant="primary" size="sm" className="navbar__mobile-btn">
                  {user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                </Button>
              </Link>
              <button className="navbar__mobile-logout" onClick={handleLogout}>Log out</button>
            </div>
          </nav>
        )}

        <div className="navbar__actions">
          <ThemeToggle />

          {user ? (
            <>
              {/* Notifications */}
              <div className="navbar__notifications" onClick={() => setNotificationsOpen((v) => !v)}>
                <button className="navbar__notify-btn" aria-label="Notifications" aria-expanded={notificationsOpen}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="navbar__notify-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className="navbar__notify-dropdown">
                    <div className="navbar__notify-header">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <button className="navbar__mark-all-read" onClick={async (e) => {
                          e.stopPropagation()
                          await fetch('/api/notifications/read-all', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
                          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
                          setUnreadCount(0)
                        }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {loadingNotifications ? (
                      <div className="navbar__notify-loading"><Loader2 size={18} className="spin" /></div>
                    ) : notifications.length === 0 ? (
                      <div className="navbar__notify-empty">No notifications yet</div>
                    ) : (
                      <div className="navbar__notify-list">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            className={`navbar__notify-item ${n.isRead ? '' : 'navbar__notify-item--unread'}`}
                            onClick={() => {
                              if (!n.isRead) {
                                fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
                                setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x))
                                setUnreadCount((prev) => Math.max(0, prev - 1))
                              }
                              if (n.link) navigate(n.link)
                              setNotificationsOpen(false)
                            }}
                          >
                            <span className="navbar__notify-message">{n.message}</span>
                            <span className="navbar__notify-time mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account menu */}
              <div className="navbar__account">
                <button className="navbar__account-toggle" onClick={() => setAccountOpen((v) => !v)} aria-expanded={accountOpen}>
                  <UserCircle size={20} /> <span>{(user.name || '').split(' ')[0] || 'Account'}</span>
                </button>
                {accountOpen && (
                  <div className="navbar__account-menu">
                    <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setAccountOpen(false)}>
                      {user.role === 'ADMIN' ? <ShieldCheck size={15} /> : <UserCircle size={15} />}
                      {user.role === 'ADMIN' ? 'Admin Panel' : 'My Dashboard'}
                    </Link>
                    <button onClick={handleLogout}><LogOut size={15} /> Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            !isGuestPage && (
              <>
                <Link to="/login" className="navbar__link-desktop"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link to="/signup" className="navbar__link-desktop"><Button variant="primary" size="sm">Sign up free</Button></Link>
              </>
            )
          )}

          {user && !isGuestPage && (
            <button className="navbar__burger" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
