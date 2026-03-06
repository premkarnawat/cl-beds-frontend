/**
 * CL-BEDS Auth Context
 * JWT-based auth with token refresh, role awareness, and user update support.
 */

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from 'react'
import { authApi, type UserOut } from './api'

interface AuthState {
  user: UserOut | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}
interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>   // re-fetch profile after update
}
type AuthContextType = AuthState & AuthActions

const TOKEN_KEY   = 'cl_beds_token'
const REFRESH_KEY = 'cl_beds_refresh'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<UserOut | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const _clearStorage = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Bootstrap
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) { setIsLoading(false); return }

    setToken(stored)
    authApi.me(stored)
      .then(setUser)
      .catch(async () => {
        const refresh = localStorage.getItem(REFRESH_KEY)
        if (refresh) {
          try {
            const tokens = await authApi.refresh(refresh)
            localStorage.setItem(TOKEN_KEY,   tokens.access_token)
            localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
            setToken(tokens.access_token)
            setUser(await authApi.me(tokens.access_token))
          } catch { _clearStorage() }
        } else { _clearStorage() }
      })
      .finally(() => setIsLoading(false))
  }, [_clearStorage])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password)
    localStorage.setItem(TOKEN_KEY,   tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
    setToken(tokens.access_token)
    setUser(await authApi.me(tokens.access_token))
  }, [])

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    await authApi.register(email, password, fullName)
    await login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    if (token) await authApi.logout(token).catch(() => {})
    _clearStorage()
  }, [token, _clearStorage])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const updated = await authApi.me(token)
    setUser(updated)
  }, [token])

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === 'admin',
      login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
