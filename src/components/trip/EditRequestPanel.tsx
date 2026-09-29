import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/auth/AuthContext'
import {
  clientPortalApi,
  type ClientEditRequest,
  type ClientHome,
} from '@/shared/api/clientPortal'
import { InlineLoader } from '@/components/ui/Primitives'

type RequestKind =
  | 'date_change'
  | 'itinerary_change'
  | 'vip_upgrade'
  | 'other'

const KIND_OPTIONS: Array<{
  id: RequestKind
  title: string
  hint: string
}> = [
  {
    id: 'date_change',
    title: 'Change dates',
    hint: 'Move arrival or departure',
  },
  {
    id: 'itinerary_change',
    title: 'Change itinerary',
    hint: 'Swap days, stops, or timing',
  },
  {
    id: 'vip_upgrade',
    title: 'VIP upgrade',
    hint: 'Ask ZEEN to upgrade your package',
  },
  {
    id: 'other',
    title: 'Something else',
    hint: 'Hotel, food, notes for the desk',
  },
]

function statusLabel(status: string) {
  if (status === 'pending') return 'Pending'
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return status
}

function statusClass(status: string) {
  if (status === 'pending') return 'bg-[#fff4e5] text-[#9a6700]'
  if (status === 'approved') return 'bg-mint text-forest'
  if (status === 'rejected') return 'bg-[#fdecec] text-[#9b2c2c]'
  return 'bg-mist text-sgraph'
}

function requestHeadline(req: ClientEditRequest) {
  if (req.reason?.trim()) {
    const first = req.reason.split(' · ')[0]?.trim()
    if (first) return first
  }
  if (req.requestedValue) {
    try {
      const parsed = JSON.parse(req.requestedValue) as {
        title?: string
        summary?: string
        kind?: string
      }
      if (parsed.summary) return parsed.summary
      if (parsed.title) return parsed.title
      if (parsed.kind) return parsed.kind.replace(/_/g, ' ')
    } catch {
      return req.requestedValue.slice(0, 80)
    }
  }
  return req.type.replace(/_/g, ' ')
}

function typeLabel(type: string) {
  return (
    KIND_OPTIONS.find((k) => k.id === type)?.title ?? type.replace(/_/g, ' ')
  )
}

export function EditRequestPanel({
  home,
  compact,
}: {
  home: ClientHome
  /** Smaller embed under My trip footer / Account */
  compact?: boolean
}) {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<RequestKind>('date_change')
  const [arrivalDate, setArrivalDate] = useState(home.arrivalDate ?? '')
  const [departureDate, setDepartureDate] = useState(home.departureDate ?? '')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: ['client-portal', 'edit-requests', home.bookingId],
    queryFn: () => clientPortalApi.editRequests(accessToken!, home.bookingId),
    enabled: Boolean(accessToken && home.bookingId),
  })

  const createMut = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error('Sign in with your ZN code first')

      if (kind === 'date_change') {
        if (!arrivalDate && !departureDate) {
          throw new Error('Pick at least one new date')
        }
        return clientPortalApi.createEditRequest(accessToken, {
          type: 'date_change',
          requestedValue: JSON.stringify({
            arrivalDate: arrivalDate || null,
            departureDate: departureDate || null,
          }),
          reason:
            details.trim() ||
            `Please change trip dates to ${arrivalDate || '—'} → ${departureDate || '—'}`,
        })
      }

      if (kind === 'vip_upgrade') {
        return clientPortalApi.createEditRequest(accessToken, {
          type: 'vip_upgrade',
          requestedValue: JSON.stringify({ isVip: true }),
          reason:
            details.trim() ||
            'Please upgrade this booking to VIP',
        })
      }

      if (!details.trim()) {
        throw new Error('Tell ZEEN what you need changed')
      }

      return clientPortalApi.createEditRequest(accessToken, {
        type: kind,
        requestedValue: details.trim(),
        reason: details.trim(),
      })
    },
    onSuccess: async () => {
      setDoneMsg('Request sent — ZEEN will review it on your booking.')
      setDetails('')
      setError(null)
      setOpen(false)
      await qc.invalidateQueries({
        queryKey: ['client-portal', 'edit-requests', home.bookingId],
      })
      await qc.invalidateQueries({ queryKey: ['client-portal', 'home'] })
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not send request')
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setDoneMsg(null)
    setError(null)
    createMut.mutate()
  }

  const requests = listQ.data ?? []
  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
              Booking changes
            </p>
            <p className="mt-1 text-[17px] font-bold text-graph">
              Request a change
            </p>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-sgraph">
              Dates, itinerary, VIP, or other notes for {home.znCode}. ZEEN
              reviews each request in the desk.
            </p>
          </div>
          {!open ? (
            <button
              type="button"
              onClick={() => {
                setOpen(true)
                setDoneMsg(null)
                setError(null)
              }}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[14px] bg-emer px-4 text-sm font-semibold text-white"
            >
              New request
            </button>
          ) : null}
        </div>

        {doneMsg ? (
          <p className="mt-3 rounded-[12px] border border-bord bg-mint/50 px-3 py-2.5 text-[13px] font-semibold text-forest">
            {doneMsg}
          </p>
        ) : null}

        {open ? (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KIND_OPTIONS.map((opt) => {
                const active = kind === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKind(opt.id)}
                    className={`rounded-[14px] border px-3 py-3 text-start transition ${
                      active
                        ? 'border-emer bg-mint/60 shadow-[var(--shadow-card)]'
                        : 'border-bord bg-ivory hover:bg-paper'
                    }`}
                  >
                    <span className="block text-[13.5px] font-semibold text-graph">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-sgraph">
                      {opt.hint}
                    </span>
                  </button>
                )
              })}
            </div>

            {kind === 'date_change' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-sgraph uppercase">
                    New arrival
                  </span>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-[14px] border border-bord bg-ivory px-3 py-3 text-sm text-graph outline-none focus:border-fresh/45"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-sgraph uppercase">
                    New departure
                  </span>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-[14px] border border-bord bg-ivory px-3 py-3 text-sm text-graph outline-none focus:border-fresh/45"
                  />
                </label>
              </div>
            ) : null}

            {kind === 'vip_upgrade' ? (
              <p className="rounded-[12px] bg-mist px-3 py-2.5 text-[13px] text-sgraph">
                Current package:{' '}
                <span className="font-semibold text-graph">
                  {home.packageName ?? 'Standard'}
                  {home.isVip ? ' · already VIP' : ''}
                </span>
                . ZEEN confirms price before upgrading.
              </p>
            ) : null}

            {(kind === 'itinerary_change' ||
              kind === 'other' ||
              kind === 'date_change' ||
              kind === 'vip_upgrade') && (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-sgraph uppercase">
                  {kind === 'date_change' || kind === 'vip_upgrade'
                    ? 'Note for ZEEN (optional)'
                    : 'What should change?'}
                </span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder={
                    kind === 'itinerary_change'
                      ? 'e.g. Move Red Square to Day 2, add mosque visit…'
                      : kind === 'other'
                        ? 'e.g. Prefer a quieter hotel, need halal dinner Friday…'
                        : 'Anything else the desk should know…'
                  }
                  className="w-full resize-y rounded-[14px] border border-bord bg-ivory px-3 py-3 text-sm text-graph outline-none placeholder:text-sgraph/70 focus:border-fresh/45"
                />
              </label>
            )}

            {kind === 'other' ? (
              <p className="text-[12px] text-sgraph">
                Need a car or stay?{' '}
                <Link to="/cars" className="font-semibold text-emer hover:underline">
                  Select a driver
                </Link>{' '}
                or{' '}
                <Link to="/stays" className="font-semibold text-emer hover:underline">
                  browse stays
                </Link>
                .
              </p>
            ) : null}

            {error ? (
              <p className="rounded-[12px] bg-[#fdecec] px-3 py-2 text-sm text-[#9b2c2c]">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={createMut.isPending}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[14px] bg-emer px-4 text-sm font-semibold text-white disabled:opacity-60 sm:flex-none"
              >
                {createMut.isPending ? 'Sending…' : 'Send to ZEEN desk'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setError(null)
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-bord bg-paper px-4 text-sm font-semibold text-sgraph"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
            Your requests
          </p>
          {pending.length > 0 ? (
            <span className="rounded-full bg-[#fff4e5] px-2.5 py-0.5 text-[11px] font-bold text-[#9a6700]">
              {pending.length} pending
            </span>
          ) : null}
        </div>

        {listQ.isLoading ? <InlineLoader /> : requests.length === 0 ? (
          <p className="mt-3 text-[13px] leading-relaxed text-sgraph">
            No change requests yet. Use New request when you need ZEEN to update
            this booking.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {requests.slice(0, compact ? 4 : 8).map((r) => (
              <li
                key={r.id}
                className="rounded-[14px] border border-bord bg-ivory px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass(r.status)}`}
                  >
                    {statusLabel(r.status)}
                  </span>
                  <span className="text-[11px] font-semibold text-sgraph">
                    {typeLabel(r.type)}
                  </span>
                  <span className="ml-auto text-[11px] text-sgraph">
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] font-semibold text-graph">
                  {requestHeadline(r)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
