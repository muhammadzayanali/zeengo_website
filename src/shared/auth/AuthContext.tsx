import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/shared/api/clientPortal'
import { setTokenRefresher } from '@/shared/api/client'
import { queryClient } from '@/shared/api/queryClient'
import type { ClientUser } from '@/shared/auth/session'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredBooking,
  normalizeZnCode,
  saveSession,
} from '@/shared/auth/session'

type AuthState = {
  ready: boolean
  isAuthenticated: boolean
  accessToken: string | null
  user: ClientUser | null
  znCode: string | null
  bookingId: string | null
  loginWithZn: (znCode: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthState | null>(null)

function readJwtBookingId(access: string): string | undefined {
  try {
    const [, payloadB64] = access.split('.')
    if (!payloadB64) return undefined
    const pad = '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const claims = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/') + pad),
    ) as { bookingId?: string }
    return claims.bookingId
  } catch {
    return undefined
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<ClientUser | null>(null)
  const [znCode, setZnCode] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const wipeLocal = useCallback(() => {
    clearSession()
    setAccessToken(null)
    setUser(null)
    setZnCode(null)
    setBookingId(null)
    queryClient.clear()
  }, [])

  const applySession = useCallback(
    (
      input: {
        accessToken: string
        refreshToken: string
        bookingId: string
        znCode: string
        user?: ClientUser | null
      },
      opts?: { clearCache?: boolean },
    ) => {
      if (opts?.clearCache !== false) {
        queryClient.clear()
      }
      saveSession({
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        bookingId: input.bookingId,
        znCode: input.znCode,
      })
      setAccessToken(input.accessToken)
      setBookingId(input.bookingId)
      setZnCode(input.znCode)
      if (input.user) setUser(input.user)
    },
    [],
  )

  const refreshSession = useCallback(async () => {
    const refreshToken = getRefreshToken()
    const booking = getStoredBooking()
    if (!refreshToken || !booking) {
      wipeLocal()
      return false
    }
    try {
      const tokens = await authApi.refresh(refreshToken)
      const claimBookingId = readJwtBookingId(tokens.accessToken)
      applySession(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          bookingId: claimBookingId || booking.bookingId,
          znCode: booking.znCode,
        },
        { clearCache: false },
      )
      try {
        const me = await authApi.me(tokens.accessToken)
        setUser(me.user)
      } catch {
        // Tokens are valid even if /me briefly fails — keep session
      }
      return true
    } catch {
      wipeLocal()
      return false
    }
  }, [applySession, wipeLocal])

  const applySessionRef = useRef(applySession)
  const refreshSessionRef = useRef(refreshSession)
  const wipeLocalRef = useRef(wipeLocal)
  applySessionRef.current = applySession
  refreshSessionRef.current = refreshSession
  wipeLocalRef.current = wipeLocal

  useEffect(() => {
    setTokenRefresher(async () => {
      const ok = await refreshSessionRef.current()
      return ok ? getAccessToken() : null
    })
    return () => setTokenRefresher(null)
  }, [])

  // Mount-only hydrate — deps must stay a fixed empty array (HMR-safe).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = getAccessToken()
      const refresh = getRefreshToken()
      const booking = getStoredBooking()

      if (!booking || (!token && !refresh)) {
        if (!cancelled) setReady(true)
        return
      }

      if (!cancelled) {
        setZnCode(booking.znCode)
        setBookingId(booking.bookingId)
      }

      try {
        let access = token
        if (!access) {
          const ok = await refreshSessionRef.current()
          if (!ok) {
            if (!cancelled) wipeLocalRef.current()
            return
          }
          access = getAccessToken()
        }

        // Upgrade legacy tokens that have no bookingId claim (same client, many ZNs).
        if (access && booking.znCode && !readJwtBookingId(access)) {
          try {
            const result = await authApi.znLogin(booking.znCode)
            if (cancelled) return
            applySessionRef.current({
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              bookingId: result.bookingId,
              znCode: result.znCode,
              user: result.user,
            })
            access = result.accessToken
          } catch {
            /* keep existing token if upgrade fails */
          }
        }

        if (access) {
          const me = await authApi.me(access)
          if (cancelled) return
          setAccessToken(access)
          setUser(me.user)
        }
      } catch {
        const ok = await refreshSessionRef.current()
        if (!ok && !cancelled) wipeLocalRef.current()
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithZn = useCallback(
    async (rawCode: string) => {
      const code = normalizeZnCode(rawCode)
      if (!/^ZN\d{4,6}$/.test(code)) {
        throw new Error('Enter a valid ZN code (e.g. ZN0004)')
      }
      const result = await authApi.znLogin(code)
      applySession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        bookingId: result.bookingId,
        znCode: result.znCode,
        user: result.user,
      })
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    const token = getAccessToken()
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken, token)
      }
    } catch {
      // ignore network logout failures — clear local session anyway
    }
    wipeLocal()
  }, [wipeLocal])

  const value = useMemo<AuthState>(
    () => ({
      ready,
      isAuthenticated: Boolean(accessToken && bookingId),
      accessToken,
      user,
      znCode,
      bookingId,
      loginWithZn,
      logout,
      refreshSession,
    }),
    [
      ready,
      accessToken,
      user,
      znCode,
      bookingId,
      loginWithZn,
      logout,
      refreshSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
