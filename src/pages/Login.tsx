/**
 * Login / Register Page — theme-aware
 */

import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'

export default function LoginPage() {
  const { login, register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [mode,     setMode]     = useState<'login' | 'register'>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, fullName)
      }
      // Redirect based on role is handled in App.tsx via isAdmin
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError((err as Error).message ?? 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-slate-800
                   border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
                   hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-lg"
        aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CL-BEDS</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Cognitive Load & Burnout Early Detection
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                        rounded-2xl p-8 shadow-xl">

          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  mode === m
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Full Name">
                <Input type="text" value={fullName} onChange={setFullName}
                  placeholder="Jane Smith" required />
              </Field>
            )}

            <Field label="Email">
              <Input type="email" value={email} onChange={setEmail}
                placeholder="you@example.com" required />
            </Field>

            <Field label="Password">
              <Input type="password" value={password} onChange={setPassword}
                placeholder="••••••••" required minLength={8} />
              {mode === 'register' && (
                <p className="text-xs text-slate-400 mt-1">
                  Min 8 characters, must include uppercase & number.
                </p>
              )}
            </Field>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800
                              rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
                         text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-1">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          For wellbeing monitoring only · Not a medical service
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ type, value, onChange, placeholder, required = false, minLength }: {
  type: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; minLength?: number
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required} minLength={minLength}
      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400
                 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
  )
}
