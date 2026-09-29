const ACCESS_KEY = 'zeengo.customer.accessToken'
const REFRESH_KEY = 'zeengo.customer.refreshToken'
const BOOKING_KEY = 'zeengo.customer.booking'

export type StoredBooking = {
  bookingId: string
  znCode: string
}

export type ClientUser = {
  id: string
  fullName: string
  phone: string
  email?: string | null
  preferredLang?: string | null
}

/** Prefer localStorage so login survives refresh / tab restore; migrate old sessionStorage. */
function readStore(key: string): string | null {
  try {
    const local = localStorage.getItem(key)
    if (local) return local
    const session = sessionStorage.getItem(key)
    if (session) {
      localStorage.setItem(key, session)
      sessionStorage.removeItem(key)
      return session
    }
    return null
  } catch {
    return null
  }
}

function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
  } catch {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }
}

function removeStore(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function getAccessToken(): string | null {
  return readStore(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return readStore(REFRESH_KEY)
}

export function getStoredBooking(): StoredBooking | null {
  try {
    const raw = readStore(BOOKING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredBooking
    if (!parsed?.bookingId || !parsed?.znCode) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(input: {
  accessToken: string
  refreshToken: string
  bookingId: string
  znCode: string
}) {
  writeStore(ACCESS_KEY, input.accessToken)
  writeStore(REFRESH_KEY, input.refreshToken)
  writeStore(
    BOOKING_KEY,
    JSON.stringify({
      bookingId: input.bookingId,
      znCode: input.znCode,
    } satisfies StoredBooking),
  )
}

export function clearSession() {
  removeStore(ACCESS_KEY)
  removeStore(REFRESH_KEY)
  removeStore(BOOKING_KEY)
}

export function normalizeZnCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (/^\d{1,6}$/.test(cleaned)) {
    return `ZN${cleaned.padStart(4, '0')}`
  }
  if (/^ZN\d{1,6}$/.test(cleaned)) {
    const digits = cleaned.slice(2)
    return `ZN${digits.padStart(4, '0')}`
  }
  return cleaned
}
