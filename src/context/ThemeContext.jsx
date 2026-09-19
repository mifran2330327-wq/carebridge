import { createContext, useContext, useEffect, useState } from 'react'

// -----------------------------------------------------------------------
// ThemeContext
// Holds the current theme ('light' | 'dark'), persists it to localStorage,
// and writes it onto <html data-theme="..."> so index.css variables switch.
// Falls back to the user's OS preference on first visit.
// -----------------------------------------------------------------------
const ThemeContext = createContext(null)

function getInitialTheme() {
  const saved = localStorage.getItem('carebridge-theme')
  if (saved === 'light' || saved === 'dark') return saved
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('carebridge-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook — components call useTheme() instead of useContext(ThemeContext)
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
