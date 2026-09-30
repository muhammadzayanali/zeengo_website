import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/auth/AuthContext'
import {
  customerBookingsApi,
  type CustomerRequestedItem,
} from '@/shared/api/customerBookings'
import {
  buildWhatsAppMessage,
  type CatalogRequestPayload,
} from '@/components/catalog/CatalogRequestButton'
import { openWhatsAppBook } from '@/shared/lib/whatsappBook'

type Step = 'form' | 'review' | 'done'

type FormState = {
  fullName: string
  phone: string
  email: string
  arrivalDate: string
  departureDate: string
  partySize: number
  childrenCount: number
  notes: string
}

function mapKind(
  kind: CatalogRequestPayload['kind'],
): CustomerRequestedItem['kind'] {
  if (kind === 'stay') return 'hotel'
  if (kind === 'food') return 'restaurant'
  return kind
}

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `web-${crypto.randomUUID()}`
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function BookingRequestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken, user, loginWithZn, znCode } = useAuth()
  const payload = (location.state as { payload?: CatalogRequestPayload } | null)
    ?.payload

  const idempotencyKey = useRef(newIdempotencyKey()).current
  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultZn, setResultZn] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [form, setForm] = useState<FormState>(() => ({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    email: '',
    arrivalDate: payload?.context?.date || today,
    departureDate:
      payload?.context?.dateTo || payload?.context?.date || today,
    partySize: Math.max(1, payload?.context?.people ?? 2),
    childrenCount: 0,
    notes: '',
  }))

  if (!payload) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-bold text-graph">Request a booking</h1>
        <p className="mt-2 text-sm text-sgraph">
          Choose a hotel, activity, car, or guide from the catalog first.
        </p>
        <Link
          to="/stays"
          className="mt-4 inline-flex min-h-11 items-center rounded-[14px] bg-emer px-4 text-sm font-semibold text-white"
        >
          Browse stays
        </Link>
      </div>
    )
  }

  // Narrowed for closures (submit) — TS does not keep the guard inside nested fns.
  const catalog = payload

  const requestedItem: CustomerRequestedItem = {
    kind: mapKind(catalog.kind),
    vendorId: catalog.itemId,
    title: catalog.title,
    detail: catalog.detail ?? undefined,
    serviceDate: form.arrivalDate || undefined,
    quantity: 1,
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return 'Name is required'
    if (!form.phone.trim()) return 'Phone is required'
    if (!form.arrivalDate || !form.departureDate)
      return 'Travel dates are required'
    if (form.departureDate < form.arrivalDate)
      return 'Departure must be on or after arrival'
    if (form.partySize < 1) return 'At least 1 guest is required'
    return null
  }

  function goReview(e: FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setStep('review')
  }

  async function submit() {
    if (submitting) return
    const v = validate()
    if (v) {
      setError(v)
      setStep('form')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const booking = await customerBookingsApi.request(
        {
          client: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || undefined,
          },
          partySize: form.partySize,
          childrenCount: form.childrenCount,
          arrivalDate: form.arrivalDate,
          departureDate: form.departureDate,
          customerNotes: form.notes.trim() || undefined,
          idempotencyKey,
          source: 'customer_web',
          requestedItems: [requestedItem],
          context: {
            from: catalog.context?.from,
            to: catalog.context?.to,
            dateLabel: catalog.context?.date,
          },
        },
        accessToken,
      )
      setResultZn(booking.znCode)
      setStep('done')
      try {
        await loginWithZn(booking.znCode)
      } catch {
        // Customer can sign in manually with the ZN on Account / My Trip.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done' && resultZn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-emer">
          Request submitted
        </p>
        <h1 className="mt-1 text-2xl font-bold text-graph">{resultZn}</h1>
        <p className="mt-2 text-sm text-sgraph">
          Your booking request is pending ZEEN review. Save this code — use it
          anytime on My Trip.
        </p>
        <p className="mt-3 rounded-[14px] bg-mist px-3 py-2 text-sm text-forest">
          Price to be confirmed by ZEEN Ops.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/trip"
            className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-emer px-4 text-sm font-semibold text-white"
          >
            Open My Trip
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-line bg-white px-4 text-sm font-semibold text-graph"
            onClick={() => navigate('/')}
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button
        type="button"
        className="text-sm font-medium text-emer"
        onClick={() => (step === 'review' ? setStep('form') : navigate(-1))}
      >
        ← Back
      </button>
      <h1 className="mt-3 text-xl font-bold text-graph">
        {step === 'review' ? 'Review your request' : 'Request booking'}
      </h1>
      <p className="mt-1 text-sm text-sgraph">
        {payload.title}
        {payload.detail ? ` · ${payload.detail}` : ''}
      </p>

      {step === 'form' ? (
        <form onSubmit={goReview} className="mt-5 space-y-3">
          <Field label="Full name">
            <input
              className="field"
              required
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              autoComplete="name"
            />
          </Field>
          <Field label="Phone">
            <input
              className="field"
              required
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              autoComplete="tel"
              placeholder="+7…"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              autoComplete="email"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Arrival">
              <input
                className="field"
                type="date"
                required
                value={form.arrivalDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, arrivalDate: e.target.value }))
                }
              />
            </Field>
            <Field label="Departure">
              <input
                className="field"
                type="date"
                required
                value={form.departureDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, departureDate: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Guests (PAX)">
              <input
                className="field"
                type="number"
                min={1}
                required
                value={form.partySize}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    partySize: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
            </Field>
            <Field label="Children">
              <input
                className="field"
                type="number"
                min={0}
                value={form.childrenCount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    childrenCount: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              className="field min-h-[88px]"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Pickup, room preference, special requests…"
            />
          </Field>
          {error ? (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] bg-emer px-4 text-sm font-semibold text-white"
          >
            Review request
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] border border-line bg-white px-4 text-sm font-semibold text-graph"
            onClick={() =>
              openWhatsAppBook(buildWhatsAppMessage(payload, znCode))
            }
          >
            Or contact ZEEN on WhatsApp
          </button>
        </form>
      ) : (
        <div className="mt-5 space-y-4">
          <ReviewBlock title="Customer">
            <p>{form.fullName}</p>
            <p>{form.phone}</p>
            {form.email ? <p>{form.email}</p> : null}
          </ReviewBlock>
          <ReviewBlock title="Trip">
            <p>
              {form.arrivalDate} → {form.departureDate}
            </p>
            <p>
              PAX {form.partySize}
              {form.childrenCount > 0
                ? ` · Children ${form.childrenCount}`
                : ''}
            </p>
            {payload.context?.from || payload.context?.to ? (
              <p>
                {[payload.context.from, payload.context.to]
                  .filter(Boolean)
                  .join(' → ')}
              </p>
            ) : null}
          </ReviewBlock>
          <ReviewBlock title="Selected service">
            <p className="font-medium">{payload.title}</p>
            {payload.detail ? (
              <p className="text-sgraph">{payload.detail}</p>
            ) : null}
          </ReviewBlock>
          {form.notes.trim() ? (
            <ReviewBlock title="Notes">
              <p>{form.notes.trim()}</p>
            </ReviewBlock>
          ) : null}
          <ReviewBlock title="Price">
            <p className="font-medium text-forest">Price to be confirmed</p>
          </ReviewBlock>
          {error ? (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] bg-emer px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit booking request'}
          </button>
        </div>
      )}

      <style>{`
        .field {
          width: 100%;
          min-height: 44px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-graph">{label}</span>
      {children}
    </label>
  )
}

function ReviewBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-3 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-sgraph">
        {title}
      </p>
      <div className="mt-1 space-y-0.5 text-graph">{children}</div>
    </div>
  )
}
