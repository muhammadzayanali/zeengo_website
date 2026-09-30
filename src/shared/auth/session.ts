const ACCESS_KEY = 'zeengo.customer.accessToken'
const REFRESH_KEY = 'zeengo.customer.refreshToken'
const BOOKING_KEY = 'zeengo.customer.booking'

/** All customer-session keys we ever wrote (incl. legacy). */
const SESSION_KEYS = [ACCESS_KEY, REFRESH_KEY, BOOKING_KEY] as const

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

/** Drop every zeengo.* key from a Storage (login leftovers / AssistiveTouch prefs stay if not prefixed). */
function purgeZeengoKeys(storage: Storage) {
  try {
    const toRemove: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key && (key.startsWith('zeengo.') || key.startsWith('zeengo_'))) {
        toRemove.push(key)
      }
    }
    for (const key of toRemove) storage.removeItem(key)
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

/** Sign-out / wipe — removeItem from localStorage + sessionStorage for all zeengo keys. */
export function clearSession() {
  for (const key of SESSION_KEYS) removeStore(key)
  try {
    purgeZeengoKeys(localStorage)
  } catch {
    /* ignore */
  }
  try {
    purgeZeengoKeys(sessionStorage)
  } catch {
    /* ignore */
  }
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
