import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/shared/api/clientPortal'
import { setTokenRefresher } from '@/shared/api/client'
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
  }, [])

  const applySession = useCallback(
    (input: {
      accessToken: string
      refreshToken: string
      bookingId: string
      znCode: string
      user?: ClientUser | null
    }) => {
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
      applySession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        bookingId: booking.bookingId,
        znCode: booking.znCode,
      })
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

  useEffect(() => {
    setTokenRefresher(async () => {
      const ok = await refreshSession()
      return ok ? getAccessToken() : null
    })
    return () => setTokenRefresher(null)
  }, [refreshSession])

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

      // Hydrate ZN badge immediately from storage while we validate tokens
      if (!cancelled) {
        setZnCode(booking.znCode)
        setBookingId(booking.bookingId)
      }

      try {
        if (token) {
          const me = await authApi.me(token)
          if (cancelled) return
          setAccessToken(token)
          setUser(me.user)
        } else {
          const ok = await refreshSession()
          if (!ok && !cancelled) wipeLocal()
        }
      } catch {
        const ok = await refreshSession()
        if (!ok && !cancelled) wipeLocal()
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshSession, wipeLocal])

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
      // Access JWT is enough for My Trip APIs; user profile is display-only.
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
