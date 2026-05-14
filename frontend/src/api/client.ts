import { useAuthStore } from '../stores/useAuthStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (requiresAuth) {
    const token = useAuthStore.getState().token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 204) {
    return undefined as T
  }

  const body = await res.json()

  if (!res.ok) {
    const err = new Error(body.message ?? '서버 오류가 발생했습니다.')
    ;(err as any).status = res.status
    ;(err as any).code = body.error
    throw err
  }

  return body as T
}
