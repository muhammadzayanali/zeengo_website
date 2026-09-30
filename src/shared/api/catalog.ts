import { apiGet } from './client'

export type Lang = 'en' | 'ar' | 'ru'
export type ListingType = 'hotels' | 'activities' | 'guides' | 'restaurants'

export type IndicativePrice = {
  amount: number
  currency: string
  basis: string
  indicative: true
}

export type ListingPrice = {
  from: number
  currency: string
  unit: string | null
  estimate: IndicativePrice | null
  indicative: true
  note: string
}

export type ListingCard = {
  id: string
  kind: 'hotel' | 'activity' | 'guide' | 'restaurant'
  title: string
  titleEn: string
  titleAr: string | null
  titleRu: string | null
  city: string
  area: string | null
  address: string | null
  summary: string | null
  subtitle: string | null
  category: string | null
  durationLabel: string | null
  languages: string | null
  imageUrl: string | null
  images: string[]
  stars: number | null
  rating: number | null
  ratingCount: number | null
  lat: number | null
  lng: number | null
  distanceKm: number | null
  roomsCount: number
  price: ListingPrice | null
}

export type Facet = { value: string; count: number }

export type ListingPage = {
  count: number
  page: number
  limit: number
  sort: string
  cities: Facet[]
  categories: Facet[]
  priceRange: { min: number; max: number } | null
  nights: number | null
  priceNote: string
  data: ListingCard[]
}

export type HotelRoom = {
  id: string
  name: string
  sizeM2: number | null
  beds: string | null
  maxGuests: number | null
  breakfast: boolean | null
  refundable: boolean | null
  images: string[]
  price:
    | (ListingPrice & { fromHotelRate: boolean })
    | null
}

export type ListingDetail = ListingCard & {
  website: string | null
  yandexMapsUrl: string | null
  cancellationPolicy: string | null
  rooms: HotelRoom[]
  nearby: ListingCard[]
}

export type TransferService = 'airport' | 'hourly' | 'day'

export type VehicleClassOption = {
  id: string
  key: string
  title: string
  titleEn: string
  group: string | null
  models: string | null
  maxPax: number
  maxBags: number | null
  note: string | null
  rates: {
    airport: number | null
    hourly: number | null
    day8: number | null
    currency: string
  }
  price: IndicativePrice | null
}

export type TrainRouteOption = {
  id: string
  key: string
  title: string
  titleEn: string
  fromStation: string
  toStation: string
  type: string | null
  typeLabel: string | null
  duration: string | null
  departures: string | null
  classes: string[]
  km: number | null
  operator: string | null
  price: IndicativePrice | null
  rateFrom: number | null
  currency: string
}

export type TimelineStep = {
  key: string
  at: string
  title: string
  detail?: string | null
}

export type ClientBookingDetail = {
  bookingId: string
  znCode: string
  status: 'active' | 'completed' | 'cancelled'
  requestStatus: 'pending' | 'under_review' | 'confirmed' | 'rejected'
  source: string
  rejectionReason: string | null
  packageName: string | null
  arrivalDate: string | null
  departureDate: string | null
  partySize: number
  childrenCount: number
  customerNotes: string | null
  createdAt: string
  balance: { total: number; paid: number; due: number }
  items: Array<{
    id: string
    kind: string
    title: string
    description: string | null
    date: string | null
    status: string
    vendorId: string | null
    imageUrl: string | null
    indicativePrice: IndicativePrice | null
    fromRequest: boolean
  }>
  timeline: TimelineStep[]
}

function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export type ListingQuery = {
  lang?: Lang
  q?: string
  city?: string
  category?: string
  stars?: number
  priceMin?: number
  priceMax?: number
  withPhotos?: boolean
  sort?: string
  lat?: number
  lng?: number
  checkIn?: string
  checkOut?: string
  rooms?: number
  people?: number
  page?: number
  limit?: number
}

export const catalogApi = {
  list(type: ListingType, q: ListingQuery) {
    return apiGet<ListingPage>(`/client/v2/browse/${type}${qs(q)}`)
  },
  detail(
    id: string,
    q: { lang?: Lang; checkIn?: string; checkOut?: string; rooms?: number; people?: number },
  ) {
    return apiGet<ListingDetail>(`/client/v2/browse/item/${encodeURIComponent(id)}${qs(q)}`)
  },
  transport(q: {
    lang?: Lang
    service: TransferService
    hours?: number
    people?: number
    bags?: number
    group?: string
  }) {
    return apiGet<{
      service: TransferService
      hours: number | null
      people: number
      priceNote: string
      data: VehicleClassOption[]
    }>(`/client/v2/transport${qs(q)}`)
  },
  trains(q: { lang?: Lang; from?: string; to?: string; people?: number }) {
    return apiGet<{ people: number; priceNote: string; data: TrainRouteOption[] }>(
      `/client/v2/trains${qs(q)}`,
    )
  },
  myBooking() {
    return apiGet<ClientBookingDetail>('/client/booking')
  },
}

export function formatMoney(amount: number, currency = 'RUB', locale = 'en') {
  const symbol = currency === 'RUB' ? '₽' : `${currency} `
  const n = Math.round(amount).toLocaleString('en-US')
  return locale === 'ar' ? `${n} ${symbol}` : `${symbol}${n}`
}
