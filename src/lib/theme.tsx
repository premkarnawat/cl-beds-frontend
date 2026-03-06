/**
 * CL-BEDS Theme Context
 * Manages dark / light mode with localStorage persistence.
 * Applies the 'dark' class to <html> for Tailwind dark mode.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'dark' | 'light'
type AccentColor = 'indigo' | 'violet' | 'blue' | 'emerald' | 'rose'

interface ThemeContextType {
  theme: Theme
  accent: AccentColor
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  setAccent: (a: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_KEY  = 'cl_beds_theme'
const ACCENT_KEY = 'cl_beds_accent'

// Accent → Tailwind colour map (used for dynamic class injection)
export const ACCENT_COLORS: Record<AccentColor, { bg: string; ring: string; hex: string; name: string }> = {
  indigo:  { bg: 'bg-indigo-600',  ring: 'ring-indigo-500',  hex: '#6366f1', name: 'Indigo'  },
  violet:  { bg: 'bg-violet-600',  ring: 'ring-violet-500',  hex: '#7c3aed', name: 'Violet'  },
  blue:    { bg: 'bg-blue-600',    ring: 'ring-blue-500',    hex: '#2563eb', name: 'Blue'    },
  emerald: { bg: 'bg-emerald-600', ring: 'ring-emerald-500', hex: '#059669', name: 'Emerald' },
  rose:    { bg: 'bg-rose-600',    ring: 'ring-rose-500',    hex: '#e11d48', name: 'Rose'    },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme,  setThemeState]  = useState<Theme>('dark')
  const [accent, setAccentState] = useState<AccentColor>('indigo')

  // Bootstrap from storage + system preference
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initial = stored ?? system
    applyTheme(initial)
    setThemeState(initial)

    const storedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor | null
    if (storedAccent && ACCENT_COLORS[storedAccent]) {
      setAccentState(storedAccent)
      applyAccent(storedAccent)
    }
  }, [])

  const applyTheme = (t: Theme) => {
    const html = document.documentElement
    if (t === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const applyAccent = (a: AccentColor) => {
    // Inject CSS variable so non-Tailwind places can use it
    document.documentElement.style.setProperty('--accent', ACCENT_COLORS[a].hex)
  }

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(THEME_KEY, t)
    applyTheme(t)
    setThemeState(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const setAccent = useCallback((a: AccentColor) => {
    localStorage.setItem(ACCENT_KEY, a)
    applyAccent(a)
    setAccentState(a)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, accent, toggleTheme, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
