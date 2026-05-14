import { apiFetch } from './client'

interface RegisterPayload {
  email: string
  password: string
  name: string
}

interface User {
  id: number
  email: string
  name: string
}

interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  user: User
}

export async function register(payload: RegisterPayload): Promise<User> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  })
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  })
}
