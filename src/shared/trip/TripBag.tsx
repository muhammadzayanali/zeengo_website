import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CustomerRequestedItem } from '@/shared/api/customerBookings'
import type { IndicativePrice } from '@/shared/api/catalog'

/** One selection in the trip bag; `request` is exactly what the API receives. */
export type TripBagItem = {
  id: string
  request: CustomerRequestedItem
  display: {
    title: string
    subtitle?: string | null
    imageUrl?: string | null
    dateLabel?: string | null
    /** Shown only as a hint; the server recomputes it on submit. */
    price?: IndicativePrice | null
  }
}

type TripBagState = {
  items: TripBagItem[]
  add: (item: Omit<TripBagItem, 'id'>) => void
  remove: (id: string) => void
  clear: () => void
  justAdded: TripBagItem | null
  dismissAdded: () => void
}

const STORAGE_KEY = 'zeen.tripBag.v1'
const MAX_ITEMS = 20

function load(): TripBagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed)
      ? parsed.filter((x): x is TripBagItem => Boolean(x && typeof x === 'object' && 'request' in x))
      : []
  } catch {
    return []
  }
}

const TripBagContext = createContext<TripBagState | null>(null)

export function TripBagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripBagItem[]>(load)
  const [justAdded, setJustAdded] = useState<TripBagItem | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage full or disabled — bag still works for this tab
    }
  }, [items])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((item: Omit<TripBagItem, 'id'>) => {
    const next = { ...item, id: crypto.randomUUID() }
    setItems((cur) => [...cur, next].slice(-MAX_ITEMS))
    setJustAdded(next)
  }, [])
  const remove = useCallback((id: string) => setItems((cur) => cur.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])
  const dismissAdded = useCallback(() => setJustAdded(null), [])

  const value = useMemo(
    () => ({ items, add, remove, clear, justAdded, dismissAdded }),
    [items, add, remove, clear, justAdded, dismissAdded],
  )
  return <TripBagContext.Provider value={value}>{children}</TripBagContext.Provider>
}

export function useTripBag() {
  const ctx = useContext(TripBagContext)
  if (!ctx) throw new Error('useTripBag must be used within TripBagProvider')
  return ctx
}

/** Earliest and latest service dates across the bag (for arrival / departure). */
export function bagDateRange(items: TripBagItem[]): { from: string | null; to: string | null } {
  const dates = items
    .flatMap((i) => [i.request.checkIn, i.request.serviceDate, i.request.checkOut])
    .filter((d): d is string => Boolean(d))
    .sort()
  return { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null }
}
