import { apiGet, apiPost, apiRequest } from '../api/client'
import type { ClientUser } from '../auth/session'

export type ZnLoginResult = {
  accessToken: string
  refreshToken: string
  bookingId: string
  znCode: string
  user: ClientUser
}

export type ClientHome = {
  bookingId: string
  znCode: string
  status: string
  clientName: string
  packageName?: string | null
  packageId?: string | null
  partySize: number
  guests?: number
  arrivalDate?: string | null
  departureDate?: string | null
  daysLeft?: number | null
  isVip?: boolean
  balance?: { total: number; paid: number; due: number }
  todayProgram?: ClientActivity[]
  open?: ClientTask[]
  done?: ClientTask[]
  driver?: {
    name: string
    phone?: string | null
    vehicle?: string | null
  } | null
  assignment?: {
    id: string
    status: string
    acceptedAt?: string | null
    startedAt?: string | null
    completedAt?: string | null
  } | null
}

export type ClientActivity = {
  id: string
  dayNumber: number
  itemDate?: string | null
  startTime?: string | null
  title: string
  description?: string | null
  locationName?: string | null
  status?: string
  meetingPoint?: string | null
  guideContact?: string | null
  vendorId?: string | null
  vendorName?: string | null
  vendorType?: string | null
  znCode?: string
}

export type ClientTask = {
  id: string
  title: string
  description?: string | null
  status: string
  dueDate?: string | null
  znCode?: string | null
}

export type ClientItinerary = {
  znCode: string
  bookingId?: string
  arrivalDate?: string | null
  departureDate?: string | null
  packageName?: string | null
  days: Array<{
    dayNumber: number
    planDate?: string | null
    carPlan?: string | null
    notes?: string | null
    title?: string | null
    activities: ClientActivity[]
  }>
}

export type ClientEditRequest = {
  id: string
  type: string
  status: string
  reason?: string | null
  requestedValue?: string | null
  createdAt: string
}

export const authApi = {
  znLogin: (znCode: string) =>
    apiPost<ZnLoginResult>('/auth/client/zn-login', {
      znCode,
      platform: 'web',
    }),
  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      skipAuthRetry: true,
    }),
  logout: (refreshToken: string, accessToken?: string | null) =>
    apiRequest<unknown>('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      token: accessToken,
      skipAuthRetry: true,
    }),
  me: (accessToken: string) =>
    apiRequest<{ type: string; user: ClientUser }>('/auth/me', {
      method: 'GET',
      token: accessToken,
      skipAuthRetry: true,
    }),
}

export const clientPortalApi = {
  home: (accessToken: string) =>
    apiGet<ClientHome>('/client/home', accessToken),
  itinerary: (accessToken: string) =>
    apiGet<ClientItinerary>('/client/itinerary', accessToken),
  suggestions: (accessToken: string) =>
    apiGet<{ znCode: string; data: Array<{ id: string; body: string }> }>(
      '/client/suggestions',
      accessToken,
    ),
  editRequests: (accessToken: string, bookingId: string) =>
    apiGet<ClientEditRequest[]>(
      `/bookings/${bookingId}/edit-requests`,
      accessToken,
    ),
  createEditRequest: (
    accessToken: string,
    body: {
      type: 'other' | 'date_change' | 'itinerary_change' | 'vip_upgrade'
      requestedValue?: string
      originalValue?: string
      reason?: string
    },
  ) => apiPost<unknown>('/edit-requests', body, accessToken),
}
