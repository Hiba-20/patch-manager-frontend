import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader2, AlertCircle, KeyRound, RefreshCw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, verifyMfa, resendMfaCode } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<'login' | 'mfa'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [mfaToken, setMfaToken] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaMessage, setMfaMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const resendTimer = useRef<ReturnType<typeof setInterval>>(null)

  useEffect(() => {
    return () => {
      if (resendTimer.current) clearInterval(resendTimer.current)
    }
  }, [])

  const startResendCooldown = () => {
    setResendCooldown(30)
    resendTimer.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await login(email, password)
      if ('mfa_token' in res) {
        setMfaToken(res.mfa_token)
        setMfaMessage(res.message)
        setStep('mfa')
        startResendCooldown()
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err as Error)?.message ??
        'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyMfa = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mfaCode.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    try {
      await verifyMfa(mfaToken, mfaCode)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Verification failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError(null)
    try {
      const res = await resendMfaCode(mfaToken)
      setMfaToken(res.mfa_token)
      setMfaMessage(res.message)
      startResendCooldown()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to resend code'
      setError(msg)
    }
  }

  const handleBackToLogin = () => {
    setStep('login')
    setMfaCode('')
    setMfaToken('')
    setError(null)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-exia-bg overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.04),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(244,63,94,0.03),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
      />

      <div className="relative w-full max-w-sm px-6">
        <div className="depth-card rounded-2xl p-8">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/30 to-transparent rounded-t-2xl" />

          <div className="mb-8 flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-exia-cyan/10 border border-exia-cyan/20 mb-4">
              {step === 'mfa' ? (
                <KeyRound size={22} className="text-exia-cyan" />
              ) : (
                <Shield size={22} className="text-exia-cyan" />
              )}
            </div>
            <h1 className="text-lg font-bold text-exia-text-primary tracking-tight">Exia Patch Manager</h1>
            <p className="mt-1 text-xs text-exia-text-secondary">
              {step === 'mfa' ? 'Enter your verification code' : 'Sign in to your account'}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-3.5 py-2.5 text-xs animate-fade-in">
                  <AlertCircle size={14} className="text-exia-red flex-shrink-0" />
                  <span className="text-exia-red font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exia.tech"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="\u2022 \u2022 \u2022 \u2022 \u2022 \u2022 \u2022 \u2022"
                    required
                    className="w-full rounded-lg border border-exia-border/50 bg-exia-card pl-3.5 pr-10 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-exia-text-muted hover:text-exia-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Signing in\u2026
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              {mfaMessage && (
                <div className="rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-3.5 py-2.5 text-xs text-exia-cyan">
                  {mfaMessage}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-3.5 py-2.5 text-xs animate-fade-in">
                  <AlertCircle size={14} className="text-exia-red flex-shrink-0" />
                  <span className="text-exia-red font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="relative w-full overflow-hidden rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Verifying\u2026
                  </span>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-exia-border/50 bg-exia-card py-2.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan hover:border-exia-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={resendCooldown > 0 ? '' : ''} />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex w-full items-center justify-center gap-1 text-xs text-exia-text-muted hover:text-exia-text-secondary transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-exia-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-exia-cyan hover:text-exia-cyan/80 hover:underline transition-colors">
              Register
            </Link>
          </p>

          <p className="mt-4 text-center text-[10px] text-exia-text-muted">
            Exia Technologies &mdash; Automated Patch Management
          </p>
        </div>
      </div>
    </div>
  )
}
