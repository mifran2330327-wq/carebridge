import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export function RequireRole({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

export function GuestOnly({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
  return children
}
