import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  verifyMfa as apiVerifyMfa,
  resendMfaCode as apiResendMfaCode,
  getMe,
  type AuthResponse,
  type LoginMfaResponse,
} from '../api/auth'

interface AuthContextType {
  user: AuthResponse | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResponse | LoginMfaResponse>
  verifyMfa: (mfaToken: string, code: string) => Promise<void>
  resendMfaCode: (mfaToken: string) => Promise<LoginMfaResponse>
  register: (username: string, email: string, password: string, inviteCode: string) => Promise<void>
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
    if ('token' in res) {
      setStoredToken(res.token)
      setUser(res)
    }
    return res
  }, [])

  const verifyMfa = useCallback(async (mfaToken: string, code: string) => {
    const res = await apiVerifyMfa({ mfa_token: mfaToken, code })
    setStoredToken(res.token)
    setUser(res)
  }, [])

  const resendMfaCode = useCallback(async (mfaToken: string) => {
    return await apiResendMfaCode(mfaToken)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string, inviteCode: string) => {
    const res = await apiRegister({ username, email, password, invite_code: inviteCode })
    setStoredToken(res.token)
    setUser(res)
  }, [])

  const logout = useCallback(() => {
    setStoredToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMfa, resendMfaCode, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
