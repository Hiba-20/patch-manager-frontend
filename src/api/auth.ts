import apiClient from './client'

export interface AuthResponse {
  token: string
  user_id: string
  username: string
  email: string
  role: string
}

export interface LoginMfaResponse {
  mfa_token: string
  user_id: string
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  invite_code: string
}

export interface VerifyMfaRequest {
  mfa_token: string
  code: string
}

export async function login(req: LoginRequest): Promise<AuthResponse | LoginMfaResponse> {
  const { data } = await apiClient.post<AuthResponse | LoginMfaResponse>('/auth/login', req)
  return data
}

export async function verifyMfa(req: VerifyMfaRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/verify-mfa', req)
  return data
}

export async function resendMfaCode(mfa_token: string): Promise<LoginMfaResponse> {
  const { data } = await apiClient.post<LoginMfaResponse>('/auth/mfa/resend', { mfa_token })
  return data
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', req)
  return data
}

export async function getMe(): Promise<AuthResponse> {
  const { data } = await apiClient.get<AuthResponse>('/auth/me')
  return data
}

export async function toggleMfa(enabled: boolean): Promise<{ mfa_enabled: boolean; message: string }> {
  const { data } = await apiClient.post('/settings/mfa/toggle', { mfa_enabled: enabled })
  return data
}
