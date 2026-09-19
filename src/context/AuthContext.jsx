import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, logout } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession)

  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener('carebridge-auth', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('carebridge-auth', sync); window.removeEventListener('storage', sync) }
  }, [])

  function signOut() { logout(); setSession(null); window.dispatchEvent(new Event('carebridge-auth')) }
  return <AuthContext.Provider value={{ session, user: session?.user || null, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }