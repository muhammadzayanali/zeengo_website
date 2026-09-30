import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthContext'
import { customerBookingsApi } from '@/shared/api/customerBookings'
import { formatMoney } from '@/shared/api/catalog'
import { bagDateRange, useTripBag, type TripBagItem } from '@/shared/trip/TripBag'
import { openWhatsAppBook } from '@/shared/lib/whatsappBook'
import { EmptyBlock } from '@/components/ui/Primitives'
import { BookingSteps, Field, fieldCls, PageIntro, SmartImage, todayIso, useLang } from '@/components/booking/BookingUi'

type Draft = {
  fullName: string
  phone: string
  email: string
  nationality: string
  arrivalDate: string
  departureDate: string
  partySize: number
  childrenCount: number
  notes: string
  idempotencyKey: string
}

type LastRequest = {
  znCode: string
  requestStatus: string
  items: Array<{ title: string; dateLabel?: string | null }>
  arrivalDate: string
  departureDate: string
}

const DRAFT_KEY = 'zeen.booking.draft.v1'
const LAST_KEY = 'zeen.booking.last.v1'

function newKey() {
  return `web-${crypto.randomUUID()}`
}

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Draft) : null
  } catch {
    return null
  }
}

function saveDraft(d: Draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
}

function digits(s: string) {
  return s.replace(/\D/g, '')
}

function BagList({ items, onRemove }: { items: TripBagItem[]; onRemove?: (id: string) => void }) {
  const { t } = useTranslation()
  const lang = useLang()
  return (
    <ul className="divide-y divide-bord overflow-hidden rounded-[20px] border border-bord bg-paper shadow-[var(--shadow-card)]">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 p-3">
          <SmartImage src={item.display.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-[12px]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-[0.1em] text-emer uppercase">{t(`book.kind.${item.request.kind}`)}</p>
            <p className="line-clamp-1 text-[14.5px] font-semibold text-graph">{item.display.title}</p>
            <p className="line-clamp-1 text-[12px] text-sgraph">{[item.display.dateLabel, item.display.subtitle].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="shrink-0 text-end">
            {item.display.price ? (
              <p className="text-[14px] font-bold text-graph">{formatMoney(item.display.price.amount, item.display.price.currency, lang)}</p>
            ) : (
              <p className="text-[11.5px] text-sgraph">{t('book.priceOnRequest')}</p>
            )}
            {onRemove ? (
              <button type="button" onClick={() => onRemove(item.id)} className="text-[12px] font-semibold text-[#C0392B]">
                {t('book.bag.remove')}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

function useIndicativeTotal(items: TripBagItem[]) {
  return useMemo(() => {
    const priced = items.filter((i) => i.display.price && i.display.price.currency === 'RUB')
    return {
      amount: priced.reduce((s, i) => s + (i.display.price?.amount ?? 0), 0),
      complete: priced.length === items.length,
      any: priced.length > 0,
    }
  }, [items])
}

function BrowseMore() {
  const { t } = useTranslation()
  const links = [
    ['/hotels', 'book.hotelsTitle'],
    ['/transport', 'book.transportTitle'],
    ['/experiences', 'book.experiencesTitle'],
    ['/trains', 'book.trainsTitle'],
    ['/guides', 'book.guidesTitle'],
  ] as const
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([to, key]) => (
        <Link key={to} to={to} className="rounded-[12px] border border-bord bg-paper px-3 py-2 text-[13px] font-semibold text-graph shadow-[var(--shadow-card)]">
          + {t(key)}
        </Link>
      ))}
    </div>
  )
}

export function BookingDetailsPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, remove } = useTripBag()
  const range = bagDateRange(items)
  const total = useIndicativeTotal(items)
  const maxPax = Math.max(1, ...items.map((i) => i.request.pax ?? 1))

  const [draft, setDraft] = useState<Draft>(() => {
    const saved = readDraft()
    return {
      fullName: saved?.fullName || user?.fullName || '',
      phone: saved?.phone || user?.phone || '',
      email: saved?.email ?? '',
      nationality: saved?.nationality ?? '',
      arrivalDate: saved?.arrivalDate || range.from || todayIso(),
      departureDate: saved?.departureDate || range.to || range.from || todayIso(),
      partySize: saved?.partySize || maxPax,
      childrenCount: saved?.childrenCount ?? 0,
      notes: saved?.notes ?? '',
      idempotencyKey: saved?.idempotencyKey || newKey(),
    }
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      arrivalDate: range.from && range.from < d.arrivalDate ? range.from : d.arrivalDate,
      departureDate: range.to && range.to > d.departureDate ? range.to : d.departureDate,
    }))
  }, [range.from, range.to])

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <PageIntro title={t('book.bag.title')} />
        <EmptyBlock title={t('book.bag.empty')} body={t('book.bag.emptyHint')} />
        <div className="mt-4">
          <BrowseMore />
        </div>
      </div>
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.fullName.trim() || digits(draft.phone).length < 7) return setError(t('book.details.required'))
    if (!draft.arrivalDate || !draft.departureDate || draft.departureDate < draft.arrivalDate) return setError(t('book.details.dates'))
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return setError(t('book.details.emailInvalid'))
    saveDraft(draft)
    navigate('/booking/review')
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setError(null)
    setDraft((d) => ({ ...d, [k]: v }))
  }

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <PageIntro title={t('book.bag.title')} body={t('book.bag.lead')} />
      <BookingSteps step={1} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="order-2 space-y-4 lg:order-1" noValidate>
          <section className="rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[17px] font-bold text-graph">{t('book.details.title')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('book.details.fullName')}>
                <input className={fieldCls} autoComplete="name" value={draft.fullName} onChange={(e) => set('fullName', e.target.value)} required />
              </Field>
              <Field label={t('book.details.phone')}>
                <input className={fieldCls} type="tel" autoComplete="tel" dir="ltr" placeholder="+971 50 000 0000" value={draft.phone} onChange={(e) => set('phone', e.target.value)} required />
              </Field>
              <Field label={t('book.details.email')}>
                <input className={fieldCls} type="email" autoComplete="email" dir="ltr" value={draft.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label={t('book.details.nationality')}>
                <input className={fieldCls} value={draft.nationality} onChange={(e) => set('nationality', e.target.value)} />
              </Field>
            </div>
          </section>
          <section className="rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[17px] font-bold text-graph">{t('book.details.trip')}</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label={t('book.details.arrival')}>
                <input className={fieldCls} type="date" min={todayIso()} value={draft.arrivalDate} onChange={(e) => set('arrivalDate', e.target.value)} />
              </Field>
              <Field label={t('book.details.departure')}>
                <input className={fieldCls} type="date" min={draft.arrivalDate} value={draft.departureDate} onChange={(e) => set('departureDate', e.target.value)} />
              </Field>
              <Field label={t('book.details.adults')}>
                <select className={fieldCls} value={draft.partySize} onChange={(e) => set('partySize', Number(e.target.value))}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label={t('book.details.children')}>
                <select className={fieldCls} value={draft.childrenCount} onChange={(e) => set('childrenCount', Number(e.target.value))}>
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <Field label={t('book.details.notes')} className="mt-3">
              <textarea className={`${fieldCls} min-h-24 py-2`} maxLength={2000} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </section>
          {error ? <p className="rounded-[12px] bg-[#FBEAE8] px-3 py-2 text-[13px] font-semibold text-[#C0392B]" role="alert">{error}</p> : null}
          <button type="submit" className="min-h-[54px] w-full rounded-[16px] bg-emer text-[15.5px] font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)]">
            {t('book.details.next')}
          </button>
        </form>

        <aside className="order-1 space-y-3 lg:order-2">
          <BagList items={items} onRemove={remove} />
          {total.any ? (
            <div className="rounded-[18px] bg-mist p-3 text-[13px]">
              <div className="flex justify-between font-semibold text-graph">
                <span>{t('book.bag.estimate')}</span>
                <span>{total.complete ? '' : `${t('book.from')} `}{formatMoney(total.amount, 'RUB', lang)}</span>
              </div>
              <p className="mt-1 text-[11.5px] text-sgraph">{t('book.indicative')}</p>
            </div>
          ) : null}
          <BrowseMore />
        </aside>
      </div>
    </div>
  )
}

export function BookingReviewPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { accessToken, user, loginWithZn } = useAuth()
  const { items, clear } = useTripBag()
  const total = useIndicativeTotal(items)
  const draft = readDraft()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!items.length || !draft) return <Navigate to="/booking/details" replace />

  const send = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    const sameClient = Boolean(accessToken && user?.phone && digits(user.phone) === digits(draft.phone))
    try {
      const booking = await customerBookingsApi.request(
        {
          client: {
            fullName: draft.fullName.trim(),
            phone: draft.phone.trim(),
            email: draft.email.trim() || undefined,
            nationality: draft.nationality.trim() || undefined,
          },
          partySize: draft.partySize,
          childrenCount: draft.childrenCount,
          arrivalDate: draft.arrivalDate,
          departureDate: draft.departureDate,
          customerNotes: draft.notes.trim() || undefined,
          idempotencyKey: draft.idempotencyKey,
          source: 'customer_web',
          requestedItems: items.map((i) => i.request),
        },
        sameClient ? accessToken : null,
      )
      const last: LastRequest = {
        znCode: booking.znCode,
        requestStatus: booking.requestStatus,
        items: items.map((i) => ({ title: i.display.title, dateLabel: i.display.dateLabel })),
        arrivalDate: draft.arrivalDate,
        departureDate: draft.departureDate,
      }
      sessionStorage.setItem(LAST_KEY, JSON.stringify(last))
      sessionStorage.removeItem(DRAFT_KEY)
      clear()
      try {
        await loginWithZn(booking.znCode, draft.phone)
        void queryClient.invalidateQueries()
      } catch {
        // The guest can still sign in with the ZN code and phone later.
      }
      navigate('/booking/confirmation', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('book.review.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <PageIntro title={t('book.review.title')} />
      <BookingSteps step={2} />
      <div className="space-y-4">
        <BagList items={items} />
        <section className="rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-graph">{t('book.review.traveller')}</h2>
            <Link to="/booking/details" className="text-[13px] font-bold text-forest underline">{t('book.review.edit')}</Link>
          </div>
          <dl className="grid gap-x-4 gap-y-1.5 text-[13.5px] sm:grid-cols-2">
            <div><dt className="text-sgraph">{t('book.details.fullName')}</dt><dd className="font-semibold text-graph">{draft.fullName}</dd></div>
            <div><dt className="text-sgraph">{t('book.details.phone')}</dt><dd className="font-semibold text-graph" dir="ltr">{draft.phone}</dd></div>
            <div><dt className="text-sgraph">{t('book.details.arrival')} → {t('book.details.departure')}</dt><dd className="font-semibold text-graph">{draft.arrivalDate} → {draft.departureDate}</dd></div>
            <div><dt className="text-sgraph">{t('book.guests')}</dt><dd className="font-semibold text-graph">{draft.partySize}{draft.childrenCount ? ` + ${draft.childrenCount}` : ''}</dd></div>
            {draft.notes ? <div className="sm:col-span-2"><dt className="text-sgraph">{t('book.details.notes')}</dt><dd className="whitespace-pre-line text-graph">{draft.notes}</dd></div> : null}
          </dl>
        </section>
        <section className="rounded-[20px] border border-[#cfe3d9] bg-mint/60 p-4">
          {total.any ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-semibold text-forest">{t('book.review.total')}</span>
              <span className="text-[22px] font-bold text-forest">{total.complete ? '' : `${t('book.from')} `}{formatMoney(total.amount, 'RUB', lang)}</span>
            </div>
          ) : null}
          <p className="mt-1 text-[13px] leading-snug text-forest">{t('book.review.disclaimer')}</p>
        </section>
        {error ? <p className="rounded-[12px] bg-[#FBEAE8] px-3 py-2 text-[13px] font-semibold text-[#C0392B]" role="alert">{error}</p> : null}
        <button type="button" disabled={busy} onClick={() => void send()} className="min-h-[54px] w-full rounded-[16px] bg-emer text-[15.5px] font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)] disabled:opacity-60">
          {busy ? t('book.review.sending') : t('book.review.send')}
        </button>
      </div>
    </div>
  )
}

export function BookingConfirmationPage() {
  const { t } = useTranslation()
  const { znCode: sessionZn } = useAuth()
  let last: LastRequest | null = null
  try {
    last = JSON.parse(sessionStorage.getItem(LAST_KEY) ?? 'null') as LastRequest | null
  } catch {
    last = null
  }
  if (!last) return <Navigate to="/bookings" replace />
  const signedIn = sessionZn === last.znCode

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <BookingSteps step={3} />
      <section className="overflow-hidden rounded-[24px] border border-bord bg-paper text-center shadow-[var(--shadow-lift)]">
        <div className="bg-gradient-to-br from-forest to-emer px-6 py-8 text-white">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">{t('book.confirm.yourCode')}</p>
          <p className="mt-2 text-[40px] font-bold tracking-[2px]" dir="ltr">{last.znCode}</p>
          <p className="mt-1 text-[12.5px] opacity-85">{t('book.confirm.keep')}</p>
        </div>
        <div className="p-6">
          <h1 className="text-[22px] font-bold text-graph">{t('book.confirm.title')}</h1>
          <p className="mt-2 text-[14px] text-sgraph">{t('book.confirm.body')}</p>
          <ul className="mt-4 space-y-1 text-start text-[13.5px]">
            {last.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3 rounded-[12px] bg-mist px-3 py-2">
                <span className="font-semibold text-graph">{i.title}</span>
                <span className="shrink-0 text-sgraph">{i.dateLabel}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to={signedIn ? `/bookings/${last.znCode}` : '/bookings'} className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-emer px-6 text-[15px] font-semibold text-white">
              {t('book.confirm.open')}
            </Link>
            <button type="button" onClick={() => openWhatsAppBook(`Salam ZEEN, my booking request is ${last!.znCode}.`)} className="inline-flex min-h-12 items-center justify-center rounded-[14px] border border-bord bg-paper px-6 text-[15px] font-semibold text-graph">
              {t('book.confirm.whatsapp')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
