import {
  clearSession,
  getAccessToken,
  getRefreshToken,
} from '@/shared/auth/session'

const FALLBACK =
  'https://zeengobackend-production-d058.up.railway.app/api/v1'

function normalizeApiBase(raw: string): string {
  const t = raw.trim().replace(/\/$/, '')
  if (!t) return ''
  if (/\/api\/v1$/i.test(t)) return t
  return `${t}/api/v1`
}

/** Empty VITE_API_BASE_URL → same-origin `/api/v1` (Vite proxy in dev). */
export function getApiBaseUrl(): string {
  const fromEnv = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || '')
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) return '/api/v1'
  return FALLBACK
}

export type ApiSuccess<T> = { success: true; data: T }
export type ApiFailure = {
  success: false
  error: { code: string; message: string; details?: unknown }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
  signal?: AbortSignal
  /** Skip 401 → refresh → retry (used by refresh/login itself). */
  skipAuthRetry?: boolean
}

type TokenRefresher = () => Promise<string | null>

let tokenRefresher: TokenRefresher | null = null
let refreshInFlight: Promise<string | null> | null = null

/** AuthProvider registers this so API calls can silent-refresh expired access JWTs. */
export function setTokenRefresher(fn: TokenRefresher | null) {
  tokenRefresher = fn
}

async function runRefreshOnce(): Promise<string | null> {
  if (!tokenRefresher) return null
  if (!refreshInFlight) {
    refreshInFlight = tokenRefresher().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

function isUnauthorizedPayload(json: unknown, res: Response): boolean {
  if (res.status === 401) return true
  if (json && typeof json === 'object' && 'success' in json) {
    const envelope = json as ApiFailure
    if (envelope.success === false) {
      const msg = (envelope.error?.message || '').toLowerCase()
      const code = (envelope.error?.code || '').toLowerCase()
      return (
        code.includes('unauthorized') ||
        code.includes('auth') ||
        msg.includes('unauthorized') ||
        msg.includes('invalid or expired') ||
        msg.includes('jwt')
      )
    }
  }
  return false
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      res.ok
        ? 'Invalid JSON from API'
        : text.slice(0, 120) || `HTTP ${res.status}`,
    )
  }
}

function unwrapData<T>(json: unknown, res: Response): T {
  if (json && typeof json === 'object' && 'success' in json) {
    const envelope = json as ApiSuccess<T> | ApiFailure
    if (!envelope.success) {
      throw new Error(envelope.error?.message || 'Request failed')
    }
    return envelope.data
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return json as T
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const token = options.token ?? getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  const json = await parseJson(res)

  if (
    !options.skipAuthRetry &&
    token &&
    isUnauthorizedPayload(json, res) &&
    getRefreshToken()
  ) {
    const next = await runRefreshOnce()
    if (next) {
      return apiRequest<T>(path, {
        ...options,
        token: next,
        skipAuthRetry: true,
      })
    }
    clearSession()
  }

  return unwrapData<T>(json, res)
}

export async function apiGet<T>(
  path: string,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', token })
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, token })
}
