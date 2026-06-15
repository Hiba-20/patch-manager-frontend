import apiClient from './client'

export interface AuthResponse {
  token: string
  user_id: string
  username: string
  email: string
  role: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', req)
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
