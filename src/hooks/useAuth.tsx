import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, getMe, type AuthResponse } from '../api/auth'

interface AuthContextType {
  user: AuthResponse | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'exia-auth-token'

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((res) => setUser(res))
      .catch(() => setStoredToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password })
    setStoredToken(res.token)
    setUser(res)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await apiRegister({ username, email, password })
    setStoredToken(res.token)
    setUser(res)
  }, [])

  const logout = useCallback(() => {
    setStoredToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
