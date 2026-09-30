import { apiGet } from './client'

export type HomeChip = {
  id: string
  label: string
  subtitle?: string | null
  iconKey?: string | null
  meta?: unknown
}

export type HomeCard = {
  id: string
  title: string
  subtitle?: string | null
  area?: string | null
  category?: string | null
  imageUrl?: string | null
  badge?: string | null
  [key: string]: unknown
}

export type HomeFeed = {
  quickChips: string[]
  categories: HomeChip[]
  suitYou: HomeChip[]
  services: HomeChip[]
  exploreFilters: HomeChip[]
  catalogStats?: {
    hotels: number
    activities: number
    guides: number
    restaurants: number
  }
  featuredHotels?: HomeCard[]
  featuredActivities?: HomeCard[]
  moscowNow: HomeCard[]
  closeToCentre: HomeCard[]
  firstTime: HomeCard[]
  withKids: HomeCard[]
  food: Array<{
    id: string
    title: string
    description?: string | null
    location?: string
    halalFriendly?: boolean | null
    imageUrl?: string | null
  }>
}

export type PlaceListItem = {
  id: string
  slug: string
  title: string
  category?: string | null
  area?: string | null
  imageUrl?: string | null
  distanceMeters: number
  section?: string | null
  [key: string]: unknown
}

export type CatalogQuery = {
  q?: string
  city?: string
  people?: number
  date?: string
  dateTo?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type HotelItem = {
  id: string
  kind: 'hotel'
  title: string
  city: string
  subtitle: string
  phone?: string | null
  contactName?: string | null
  people?: number | null
  date?: string | null
  from?: string | null
  to?: string | null
}

export type ActivityItem = {
  id: string
  kind: 'activity'
  title: string
  city: string
  subtitle: string
  phone?: string | null
}

export type GuideItem = {
  id: string
  kind: 'guide'
  title: string
  city: string
  subtitle: string
  phone?: string | null
}

export type RestaurantItem = {
  id: string
  kind: 'restaurant' | 'place'
  title: string
  city: string
  subtitle: string
  phone?: string | null
  imageUrl?: string | null
  halalFriendly?: boolean
  slug?: string | null
}

export type CarItem = {
  id: string
  kind: 'driver' | 'class'
  title: string
  subtitle: string
  vehicle?: string | null
  status?: string
  rating?: number | null
  tripsCount?: number
  phone?: string | null
  people?: number
  date?: string | null
  from?: string | null
  to?: string | null
  priceLabel?: string | null
}

export type CatalogList<T> = {
  count: number
  page?: number
  limit?: number
  cities?: string[]
  data: T[]
  ctaHint?: string
}

function catalogQs(query: CatalogQuery = {}): string {
  const p = new URLSearchParams()
  if (query.q) p.set('q', query.q)
  if (query.city) p.set('city', query.city)
  if (query.people != null) p.set('people', String(query.people))
  if (query.date) p.set('date', query.date)
  if (query.from) p.set('from', query.from)
  if (query.to) p.set('to', query.to)
  if (query.page != null) p.set('page', String(query.page))
  if (query.limit != null) p.set('limit', String(query.limit))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const clientV2Api = {
  home: () => apiGet<HomeFeed>('/client/v2/home'),
  places: (qs = '') =>
    apiGet<{
      origin: { lat: number; lng: number; label: string }
      categories: Array<{ id: string; label: string; iconKey?: string | null }>
      sections: Record<
        string,
        Array<
          PlaceListItem & {
            badge?: string | null
            kind?: string
          }
        >
      >
      places?: PlaceListItem[]
      data?: PlaceListItem[]
    }>(`/client/v2/places${qs}`),
  place: (slugOrId: string) =>
    apiGet<Record<string, unknown>>(
      `/client/v2/places/${encodeURIComponent(slugOrId)}`,
    ),
  destinations: (qs = '') =>
    apiGet<{
      data: Array<{
        id: string
        title: string
        tags?: string[]
        imageUrl?: string | null
      }>
      filters?: Array<{ id: string; label: string }>
      matchCount?: number
      statusTitle?: string
    }>(`/client/v2/destinations${qs}`),
  hotels: (query: CatalogQuery = {}) =>
    apiGet<CatalogList<HotelItem>>(
      `/client/v2/catalog/hotels${catalogQs(query)}`,
    ),
  activities: (query: CatalogQuery = {}) =>
    apiGet<CatalogList<ActivityItem>>(
      `/client/v2/catalog/activities${catalogQs(query)}`,
    ),
  guides: (query: CatalogQuery = {}) =>
    apiGet<CatalogList<GuideItem>>(
      `/client/v2/catalog/guides${catalogQs(query)}`,
    ),
  restaurants: (query: CatalogQuery = {}) =>
    apiGet<CatalogList<RestaurantItem>>(
      `/client/v2/catalog/restaurants${catalogQs(query)}`,
    ),
  cars: (query: CatalogQuery = {}) =>
    apiGet<CatalogList<CarItem> & { ctaHint?: string }>(
      `/client/v2/catalog/cars${catalogQs(query)}`,
    ),
  search: (q: string) =>
    apiGet<{
      q: string
      places: Array<{
        id: string
        title: string
        subtitle?: string
        imageUrl?: string | null
        to: string
      }>
      destinations: Array<{
        id: string
        title: string
        subtitle?: string
        imageUrl?: string | null
        to: string
      }>
      hotels: Array<HotelItem & { to: string }>
      restaurants: Array<RestaurantItem & { to: string }>
      activities?: Array<ActivityItem & { to: string }>
      guides?: Array<GuideItem & { to: string }>
    }>(`/client/v2/search?q=${encodeURIComponent(q)}`),
  trip: () => apiGet<unknown>('/client/v2/trip'),
}
