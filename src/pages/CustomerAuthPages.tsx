import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthContext'
import { clientPortalApi } from '@/shared/api/clientPortal'
import { clientV2Api } from '@/shared/api/clientV2'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from '@/components/ui/Primitives'
import { TripPlanView, type TripDay } from '@/components/trip/TripPlanView'
import { EditRequestPanel } from '@/components/trip/EditRequestPanel'
import { GuestChatLauncher } from '@/components/chat/GuestChatLauncher'

export function ZnLoginForm({
  onSuccess,
  compact,
}: {
  onSuccess?: () => void
  compact?: boolean
}) {
  const { loginWithZn } = useAuth()
  const [znCode, setZnCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canSubmit = znCode.trim().length >= 2 && !busy

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await loginWithZn(znCode)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={
        compact
          ? 'space-y-3 rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]'
          : 'overflow-hidden rounded-[24px] border border-bord bg-paper shadow-[var(--shadow-lift)]'
      }
    >
      {!compact ? (
        <div className="border-b border-bord bg-gradient-to-br from-mist via-paper to-[#e8f3ed] px-5 py-5 md:px-6 md:py-6">
          <p className="text-[11px] font-bold tracking-[0.2em] text-emer uppercase">
            ZEEN booking access
          </p>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.3px] text-graph md:text-[24px]">
            Enter your ZN code
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-sgraph">
            Opens your itinerary, driver, hotel notes, and desk support.
          </p>
        </div>
      ) : null}

      <div className={compact ? '' : 'space-y-4 px-5 py-5 md:px-6 md:py-6'}>
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-sgraph uppercase">
            ZN code
          </span>
          <input
            value={znCode}
            onChange={(e) =>
              setZnCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            }
            placeholder="e.g. ZN0004"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            className="w-full rounded-[16px] border border-bord bg-ivory px-4 py-3.5 font-mono text-[18px] tracking-[0.14em] text-graph outline-none placeholder:font-sans placeholder:text-[15px] placeholder:tracking-normal placeholder:text-sgraph/70 focus:border-fresh/45 focus:bg-paper focus:shadow-[0_0_0_3px_rgba(62,142,104,0.12)]"
            aria-label="ZN booking code"
          />
        </label>

        {error ? (
          <p className="rounded-[12px] bg-[#fdecec] px-3 py-2.5 text-sm text-[#9b2c2c]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex min-h-[52px] w-full items-center justify-center rounded-[16px] px-5 text-[15px] font-semibold transition ${
            canSubmit
              ? 'bg-emer text-white shadow-[0_4px_14px_rgba(31,107,79,.28)] hover:bg-forest'
              : 'cursor-not-allowed bg-mist text-sgraph'
          }`}
        >
          {busy ? 'Checking…' : 'Open my trip'}
        </button>

        {!compact ? (
          <p className="text-center text-[12px] text-sgraph">
            No code yet? Browse{' '}
            <Link to="/around" className="font-semibold text-emer hover:underline">
              Around
            </Link>{' '}
            or{' '}
            <Link to="/explore" className="font-semibold text-emer hover:underline">
              Explore
            </Link>
            .
          </p>
        ) : null}
      </div>
    </form>
  )
}

/** Authenticated My Trip — ZN booking data in client plan UI. */
function assignmentLabel(status?: string | null) {
  switch (status) {
    case 'pending':
      return 'Awaiting driver confirmation'
    case 'accepted':
      return 'Driver accepted'
    case 'in_progress':
    case 'active':
      return 'Trip in progress'
    case 'completed':
      return 'Driver completed this trip'
    case 'rejected':
      return 'Driver declined'
    case 'cancelled':
      return 'Assignment cancelled'
    default:
      return status ? status.replace(/_/g, ' ') : null
  }
}

function AuthenticatedTrip() {
  const { accessToken, bookingId, znCode, logout, refreshSession, loginWithZn } =
    useAuth()
  const [rebinding, setRebinding] = useState(false)
  const homeQ = useQuery({
    queryKey: ['client-portal', 'home', bookingId, accessToken],
    queryFn: () => clientPortalApi.home(accessToken!),
    enabled: Boolean(accessToken && bookingId),
    retry: 1,
  })
  const itinQ = useQuery({
    queryKey: ['client-portal', 'itinerary', bookingId, accessToken],
    queryFn: () => clientPortalApi.itinerary(accessToken!),
    enabled: Boolean(accessToken && bookingId),
    retry: 1,
  })

  const home = homeQ.data
  const sessionMismatch = Boolean(
    home &&
      ((znCode && home.znCode && home.znCode !== znCode) ||
        (bookingId && home.bookingId && home.bookingId !== bookingId)),
  )

  // Old API / stale token → home is another ZN. Re-bind session to the badge ZN.
  useEffect(() => {
    if (!sessionMismatch || !znCode || rebinding) return
    let cancelled = false
    setRebinding(true)
    void (async () => {
      try {
        await loginWithZn(znCode)
        if (!cancelled) {
          await Promise.all([homeQ.refetch(), itinQ.refetch()])
        }
      } catch {
        if (!cancelled) await logout()
      } finally {
        if (!cancelled) setRebinding(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMismatch, znCode])

  if (homeQ.isLoading || itinQ.isLoading || rebinding || sessionMismatch) {
    return <LoadingBlock fill />
  }
  if (homeQ.isError) {
    const msg =
      homeQ.error instanceof Error
        ? homeQ.error.message
        : 'Could not load your trip'
    const looksAuth = /unauthor/i.test(msg)
    return (
      <ErrorBlock
        message={
          looksAuth
            ? 'Session expired — sign in again with your ZN code.'
            : msg
        }
        onRetry={() => {
          void (async () => {
            if (looksAuth) {
              const ok = await refreshSession()
              if (!ok) {
                await logout()
                return
              }
            }
            void homeQ.refetch()
            void itinQ.refetch()
          })()
        }}
      />
    )
  }

  if (!home) return <LoadingBlock fill />

  const itin = itinQ.data
  const bookingDays: TripDay[] = (itin?.days ?? []).map((day) => ({
    dayNumber: day.dayNumber,
    title:
      day.title ||
      day.carPlan ||
      day.notes ||
      (day.planDate ? `Day ${day.dayNumber} · ${day.planDate}` : `Day ${day.dayNumber}`),
    planDate: day.planDate,
    mosqueKm: null,
    stops:
      day.activities.length > 0
        ? day.activities.map((a) => ({
            id: a.vendorId ?? undefined,
            title: a.title,
            subtitle: [a.locationName, a.vendorName, a.vendorType, a.startTime]
              .filter(Boolean)
              .join(' · '),
          }))
        : [
            {
              title: 'ZEEN will publish stops for this day',
              subtitle: day.notes || day.carPlan || 'Check back after your desk updates Ops',
            },
          ],
  }))

  const hasStops = (itin?.days ?? []).some((d) => d.activities.length > 0)
  const days = bookingDays
  const assignStatus = home.assignment?.status ?? null
  const assignLabel = assignmentLabel(assignStatus)
  const hasLiveDriver = Boolean(
    home.driver &&
      assignStatus &&
      ['accepted', 'in_progress', 'active'].includes(assignStatus),
  )
  const todayItems = home.todayProgram ?? []

  return (
    <TripPlanView
      title={`${home.znCode} trip`}
      subtitle={`${home.clientName}${home.packageName ? ` · ${home.packageName}` : ''}${
        home.arrivalDate && home.departureDate
          ? ` · ${home.arrivalDate} → ${home.departureDate}`
          : ''
      }`}
      days={days}
      showHeart={false}
      showJourney={days.length > 1}
      topBar={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-bold tracking-[0.12em] text-emer uppercase">
            {home.znCode}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-[13px] border border-bord bg-paper px-3 py-1.5 text-sm font-semibold text-sgraph"
          >
            Sign out
          </button>
        </div>
      }
      headerExtra={
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              [home.arrivalDate ?? '—', 'arrival'],
              [home.departureDate ?? '—', 'departure'],
              [String(home.partySize ?? '—'), 'travellers'],
              [
                home.balance != null ? `₽${home.balance.due}` : '—',
                'balance due',
              ],
            ].map(([n, l]) => (
              <div
                key={l}
                className="rounded-[16px] border border-bord bg-paper px-2 py-3 text-center shadow-[var(--shadow-card)]"
              >
                <p className="truncate text-[15px] font-bold text-graph sm:text-[16px]">
                  {n}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-sgraph uppercase">
                  {l}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] border border-bord bg-mint/50 px-4 py-3">
            <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
              Your driver
            </p>
            {home.driver ? (
              <>
                <p className="mt-0.5 font-semibold text-graph">
                  {home.driver.name}
                </p>
                <p className="text-[12.5px] text-sgraph">
                  {[home.driver.vehicle, home.driver.phone]
                    .filter(Boolean)
                    .join(' · ') || 'On your booking'}
                </p>
                {assignLabel ? (
                  <p className="mt-1 text-[12px] font-semibold text-forest">
                    {assignLabel}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-0.5 font-semibold text-graph">
                  No driver assigned yet
                </p>
                <p className="text-[12.5px] text-sgraph">
                  Select a driver for {home.znCode} — ZEEN confirms, then your
                  driver completes the ride.
                </p>
                <Link
                  to="/cars"
                  className="mt-2 inline-flex text-[13px] font-semibold text-emer hover:underline"
                >
                  Select a driver ›
                </Link>
              </>
            )}
          </div>

          <EditRequestPanel home={home} compact />

          <GuestChatLauncher bookingId={home.bookingId} znCode={home.znCode} />

          {todayItems.length > 0 ? (
            <div className="rounded-[16px] border border-bord bg-paper px-4 py-3">
              <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
                Today
              </p>
              <ul className="mt-2 space-y-2">
                {todayItems.map((a) => (
                  <li key={a.id}>
                    <p className="text-[14px] font-semibold text-graph">
                      {a.title}
                    </p>
                    <p className="text-[12px] text-sgraph">
                      {[a.startTime, a.locationName, a.vendorName]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!hasStops ? (
            <div className="rounded-[16px] border border-bord bg-paper px-4 py-5">
              <p className="text-[11px] font-bold tracking-[0.16em] text-emer uppercase">
                Days
              </p>
              <p className="mt-1 text-[20px] font-bold text-graph">Your itinerary</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sgraph">
                Your stay dates are live from ZEEN Ops. Day-by-day stops appear
                here as soon as the desk publishes them for {home.znCode}.
              </p>
            </div>
          ) : (
            <div className="pt-1">
              <p className="text-[11px] font-bold tracking-[0.16em] text-emer uppercase">
                Days
              </p>
              <p className="mt-1 text-[22px] font-bold tracking-[-0.3px] text-graph md:text-[26px]">
                Itinerary
              </p>
            </div>
          )}
        </div>
      }
      footer={
        <div className="space-y-2">
          {!hasLiveDriver ? (
            <Link
              to="/cars"
              className="flex min-h-12 w-full items-center justify-center rounded-[16px] bg-emer px-5 font-semibold text-white shadow-[0_4px_14px_rgba(31,107,79,.25)]"
            >
              {home.driver ? 'Change driver' : 'Select a driver'}
            </Link>
          ) : (
            <Link
              to="/cars"
              className="flex min-h-12 w-full items-center justify-center rounded-[16px] border border-bord bg-paper px-5 font-semibold text-forest shadow-[var(--shadow-card)]"
            >
              Request another car
            </Link>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/stays"
              className="flex min-h-11 items-center justify-center rounded-[14px] border border-bord bg-paper text-[13px] font-semibold text-graph"
            >
              Stays
            </Link>
            <Link
              to="/food"
              className="flex min-h-11 items-center justify-center rounded-[14px] border border-bord bg-paper text-[13px] font-semibold text-graph"
            >
              Food
            </Link>
          </div>
        </div>
      }
    />
  )
}

/** Guest My Trip — ZN login first; optional sample discovery preview. */
function GuestTripTemplate() {
  const navigate = useNavigate()
  const [showSample, setShowSample] = useState(false)

  const q = useQuery({
    queryKey: ['client-v2', 'trip'],
    queryFn: () =>
      clientV2Api.trip() as Promise<{
        tripDaysCount?: number
        subtitle?: string
        days?: Array<{
          dayNumber: number
          title: string
          mosqueKm?: number | null
          stops: Array<{
            title: string
            subtitle?: string | null
            lat?: number
            lng?: number
          }>
        }>
      }>,
    enabled: showSample,
  })

  if (!showSample) {
    return (
      <div className="mx-auto max-w-xl pb-4">
        <p className="text-[12px] font-bold tracking-[0.2em] text-emer uppercase">
          My trip
        </p>
        <h1 className="mt-2 text-[32px] font-bold tracking-[-0.5px] text-graph md:text-[40px]">
          Open your ZEEN booking
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-sgraph">
          Sign in with your ZN code to load the live itinerary from ZEEN Ops —
          stay dates, day plans, vendors, and driver status from the admin desk.
        </p>
        <div className="mt-6">
          <ZnLoginForm onSuccess={() => navigate('/trip')} />
        </div>
        <button
          type="button"
          onClick={() => setShowSample(true)}
          className="mt-6 text-[13px] font-semibold text-emer hover:underline"
        >
          Preview a sample Moscow plan ›
        </button>
      </div>
    )
  }

  if (q.isLoading) return <LoadingBlock fill label="Sample plan" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed to load'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!
  const days: TripDay[] = (data.days ?? []).map((d) => ({
    dayNumber: d.dayNumber,
    title: d.title,
    mosqueKm: d.mosqueKm,
    stops: d.stops.map((s) => ({
      title: s.title,
      subtitle: s.subtitle,
      lat: s.lat,
      lng: s.lng,
    })),
  }))

  if (days.length === 0) {
    return (
      <EmptyBlock
        title="No sample days"
        body="Sign in with your ZN code to open your real booking from ZEEN Ops."
      />
    )
  }

  return (
    <TripPlanView
      title="Sample Moscow plan"
      subtitle={
        data.subtitle ?? 'Kids, food and the nearest mosque for every day.'
      }
      days={days}
      showHeart
      showJourney
      headerExtra={
        <div className="space-y-3">
          <p className="rounded-[14px] border border-bord bg-mint/40 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-forest">
            This is a curated preview — not your booking. Sign in with your ZN
            code to open the live trip from ZEEN Ops / admin.
          </p>
          <div className="mx-auto max-w-md md:mx-0">
            <ZnLoginForm compact onSuccess={() => navigate('/trip')} />
          </div>
          <button
            type="button"
            onClick={() => setShowSample(false)}
            className="text-[12px] font-semibold text-sgraph"
          >
            Back to ZN login
          </button>
        </div>
      }
    />
  )
}

export function MyTripPage() {
  const { ready, isAuthenticated } = useAuth()
  if (!ready) return <LoadingBlock fill />
  return isAuthenticated ? <AuthenticatedTrip /> : <GuestTripTemplate />
}

export function AccountPage() {
  const { ready, isAuthenticated, user, znCode, bookingId, accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const homeQ = useQuery({
    queryKey: ['client-portal', 'home', 'account', bookingId, accessToken],
    queryFn: () => clientPortalApi.home(accessToken!),
    enabled: Boolean(isAuthenticated && accessToken && bookingId),
  })

  if (!ready) return <LoadingBlock fill />

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-[12px] font-bold tracking-[0.2em] text-emer uppercase">
          Account
        </p>
        <h1 className="mt-2 text-[34px] font-bold tracking-[-0.5px] text-graph md:text-[40px]">
          Sign in to ZEEN
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-sgraph">
          Use your ZN booking code to open trip details and request changes
          in-app.
        </p>
        <div className="mt-6">
          <ZnLoginForm onSuccess={() => navigate('/trip')} />
        </div>
        <div className="mt-6 space-y-3">
          <Link
            to="/money"
            className="flex min-h-14 items-center justify-between rounded-[18px] border border-bord bg-paper px-4 font-semibold shadow-[var(--shadow-card)]"
          >
            Money & rates <span className="text-sgraph">›</span>
          </Link>
          <Link
            to="/login"
            className="flex min-h-14 items-center justify-between rounded-[18px] border border-bord bg-paper px-4 font-semibold shadow-[var(--shadow-card)]"
          >
            Open my trip with ZN <span className="text-sgraph">›</span>
          </Link>
        </div>
      </div>
    )
  }

  const home = homeQ.data

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold tracking-[0.18em] text-emer uppercase">
            {znCode}
          </p>
          <h1 className="mt-1 text-[32px] font-bold tracking-[-0.45px] text-graph">
            {user?.fullName ?? 'Account'}
          </h1>
          <p className="mt-2 text-sm text-sgraph">
            {user?.phone}
            {home?.packageName ? ` · ${home.packageName}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-[13px] border border-bord bg-paper px-3 py-2 text-sm font-semibold text-sgraph"
        >
          Sign out
        </button>
      </div>

      {homeQ.isLoading ? <LoadingBlock label="Booking" /> : null}
      {home ? (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold tracking-wide text-sgraph uppercase">
                Trip dates
              </p>
              <p className="mt-1 font-semibold text-graph">
                {home.arrivalDate ?? '—'} → {home.departureDate ?? '—'}
              </p>
              <p className="mt-1 text-xs text-sgraph">
                {home.partySize} travellers · {home.status}
              </p>
            </div>
            <div className="rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold tracking-wide text-sgraph uppercase">
                Balance
              </p>
              <p className="mt-1 font-semibold text-graph">
                Due ₽{home.balance?.due ?? 0}
              </p>
              <p className="mt-1 text-xs text-sgraph">
                Paid ₽{home.balance?.paid ?? 0} of ₽{home.balance?.total ?? 0}
              </p>
            </div>
          </div>
          <EditRequestPanel home={home} />
          <GuestChatLauncher
            bookingId={home.bookingId}
            znCode={home.znCode}
            variant="row"
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <Link
          to="/trip"
          className="flex min-h-14 items-center justify-between rounded-[18px] border border-bord bg-paper px-4 font-semibold shadow-[var(--shadow-card)]"
        >
          My trip <span className="text-sgraph">›</span>
        </Link>
        <Link
          to="/money"
          className="flex min-h-14 items-center justify-between rounded-[18px] border border-bord bg-paper px-4 font-semibold shadow-[var(--shadow-card)]"
        >
          Money & rates <span className="text-sgraph">›</span>
        </Link>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { ready, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (ready && isAuthenticated) {
      navigate('/trip', { replace: true })
    }
  }, [ready, isAuthenticated, navigate])

  if (!ready) return <LoadingBlock fill />
  if (isAuthenticated) return <LoadingBlock fill label="Your trip" />

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[12px] font-bold tracking-[0.2em] text-emer uppercase">
        Sign in
      </p>
      <h1 className="mt-2 text-[34px] font-bold tracking-[-0.5px] text-graph md:text-[40px]">
        Your ZN code
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-sgraph">
        Use the code from your ZEEN booking confirmation.
      </p>
      <div className="mt-6">
        <ZnLoginForm onSuccess={() => navigate('/trip')} />
      </div>
    </div>
  )
}
