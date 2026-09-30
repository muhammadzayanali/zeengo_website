import { apiRequest } from './client'

export type CustomerRequestedItem = {
  kind:
    | 'hotel'
    | 'activity'
    | 'restaurant'
    | 'guide'
    | 'car'
    | 'transfer'
    | 'train'
    | 'service'
  vendorId?: string
  title: string
  detail?: string
  serviceDate?: string
  quantity?: number
  roomId?: string
  checkIn?: string
  checkOut?: string
  rooms?: number
  vehicleClassId?: string
  transferService?: 'airport' | 'hourly' | 'day'
  hours?: number
  trainRouteId?: string
  trainClass?: string
  pax?: number
  from?: string
  to?: string
  time?: string
}

export type CreateCustomerBookingRequest = {
  client: {
    fullName: string
    phone: string
    email?: string
    nationality?: string
  }
  partySize: number
  childrenCount?: number
  arrivalDate: string
  departureDate: string
  packageId?: string
  customerNotes?: string
  idempotencyKey: string
  source?: 'customer_web' | 'customer_app'
  requestedItems?: CustomerRequestedItem[]
  context?: {
    from?: string
    to?: string
    dateLabel?: string
  }
}

export type CustomerBookingResult = {
  id: string
  znCode: string
  clientId: string
  status: string
  requestStatus: string
  source: string
  arrivalDate: string | null
  departureDate: string | null
  partySize: number
  childrenCount?: number
  totalAmount: number
  customerNotes?: string | null
}

export const customerBookingsApi = {
  request(body: CreateCustomerBookingRequest, token?: string | null) {
    return apiRequest<CustomerBookingResult>('/client/bookings/request', {
      method: 'POST',
      body,
      token,
      skipAuthRetry: !token,
    })
  },
}
