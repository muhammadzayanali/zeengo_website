import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatMoney, type IndicativePrice, type ListingCard, type ListingPrice } from '@/shared/api/catalog'
import { useTripBag } from '@/shared/trip/TripBag'
import { normalizeLocale } from '@/shared/i18n'

export function useLang() {
  const { i18n } = useTranslation()
  return normalizeLocale(i18n.language)
}

export function SmartImage({
  src,
  fallbacks = [],
  alt,
  className = '',
}: {
  src: string | null | undefined
  /** Tried in order when an image fails to load. */
  fallbacks?: string[]
  alt: string
  className?: string
}) {
  const candidates = [src, ...fallbacks].filter((x, i, a): x is string => Boolean(x) && a.indexOf(x) === i)
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [src])
  const current = candidates[index]
  if (!current) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-mint via-mist to-[#e9efe9] ${className}`}
        aria-hidden
      >
        <span className="text-[11px] font-bold tracking-[0.22em] text-emer/60 uppercase">aLo · ZEEN</span>
      </div>
    )
  }
  return (
    <img
      key={current}
      src={current}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndex((i) => i + 1)}
      className={`object-cover ${className}`}
    />
  )
}

export function Stars({ n }: { n: number | null | undefined }) {
  if (!n) return null
  return (
    <span className="text-[12px] tracking-[1px] text-champ" aria-label={`${n} stars`}>
      {'★'.repeat(Math.min(5, n))}
    </span>
  )
}

function unitLabel(unit: string | null | undefined, t: (k: string) => string) {
  if (unit === 'night') return t('book.perNight')
  if (unit === 'person') return t('book.perPerson')
  if (unit === 'hour') return t('book.perHour')
  return ''
}

/** "from ₽4,500 / night · indicative" — never presented as a final price. */
export function PriceTag({
  price,
  estimate,
  align = 'end',
}: {
  price?: ListingPrice | null
  estimate?: IndicativePrice | null
  align?: 'start' | 'end'
}) {
  const { t } = useTranslation()
  const lang = useLang()
  const est = estimate ?? price?.estimate ?? null
  const alignCls = align === 'end' ? 'text-end' : 'text-start'
  if (!price && !est) {
    return <p className={`text-[12px] font-semibold text-sgraph ${alignCls}`}>{t('book.priceOnRequest')}</p>
  }
  return (
    <div className={alignCls}>
      {est ? (
        <>
          <p className="text-[17px] font-bold tracking-[-0.2px] text-graph">
            {formatMoney(est.amount, est.currency, lang)}
          </p>
          <p className="text-[11px] text-sgraph">{est.basis}</p>
        </>
      ) : price ? (
        <p className="text-graph">
          <span className="text-[11px] text-sgraph">{t('book.from')} </span>
          <span className="text-[17px] font-bold tracking-[-0.2px]">
            {formatMoney(price.from, price.currency, lang)}
          </span>
          <span className="text-[11px] text-sgraph"> {unitLabel(price.unit, t)}</span>
        </p>
      ) : null}
      <p className="text-[10.5px] font-semibold tracking-[0.04em] text-emer uppercase">{t('book.indicativeShort')}</p>
    </div>
  )
}

export function ListingCardView({ item, to }: { item: ListingCard; to: string }) {
  const { t } = useTranslation()
  const place = [item.area, item.city].filter(Boolean).join(' · ')
  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-bord bg-paper shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:flex-row"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-auto sm:w-[260px]">
        <SmartImage src={item.imageUrl} fallbacks={item.images} alt={item.title} className="h-full w-full" />
        {item.images.length > 1 ? (
          <span className="absolute bottom-2 start-2 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-semibold text-white">
            {item.images.length} {t('book.photos')}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Stars n={item.stars} />
              {item.category ? (
                <span className="rounded-full bg-mist px-2 py-0.5 text-[10.5px] font-semibold text-sgraph">{item.category}</span>
              ) : null}
            </div>
            <h3 className="mt-0.5 line-clamp-2 text-[16.5px] font-bold tracking-[-0.2px] text-graph">{item.title}</h3>
            {place ? <p className="mt-0.5 line-clamp-1 text-[12.5px] text-sgraph">{place}</p> : null}
          </div>
          {item.rating ? (
            <span className="shrink-0 rounded-[10px] bg-forest px-2 py-1 text-[12px] font-bold text-white">
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        {item.summary ? <p className="line-clamp-2 text-[13px] leading-snug text-sgraph">{item.summary}</p> : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1.5 text-[11px] text-sgraph">
            {item.distanceKm != null ? <span className="rounded-full border border-bord px-2 py-0.5">{item.distanceKm} km</span> : null}
            {item.roomsCount ? (
              <span className="rounded-full border border-bord px-2 py-0.5">
                {t('book.roomTypes', { count: item.roomsCount })}
              </span>
            ) : null}
            {item.durationLabel ? <span className="rounded-full border border-bord px-2 py-0.5">{item.durationLabel}</span> : null}
          </div>
          <PriceTag price={item.price} />
        </div>
      </div>
    </Link>
  )
}

export function TripBagButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const { items } = useTripBag()
  return (
    <Link
      to="/booking/details"
      className={`relative inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-bord bg-paper px-3 text-sm font-semibold text-graph shadow-[var(--shadow-card)] ${className}`}
      aria-label={t('book.bag.title')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span className="hidden lg:inline">{t('book.bag.title')}</span>
      {items.length ? (
        <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emer px-1 text-[11px] font-bold text-white">
          {items.length}
        </span>
      ) : null}
    </Link>
  )
}

export function AddedToTripToast() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { justAdded, dismissAdded, items } = useTripBag()
  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(dismissAdded, 6000)
    return () => window.clearTimeout(timer)
  }, [justAdded, dismissAdded])
  if (!justAdded) return null
  return (
    <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md animate-page-enter rounded-[18px] border border-[#cfe3d9] bg-paper p-3 shadow-[var(--shadow-lift)] md:bottom-6" role="status">
      <div className="flex items-center gap-3">
        <SmartImage src={justAdded.display.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-[12px]" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.12em] text-emer uppercase">{t('book.added')}</p>
          <p className="truncate text-sm font-semibold text-graph">{justAdded.display.title}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissAdded()
            navigate('/booking/details')
          }}
          className="shrink-0 rounded-[12px] bg-emer px-3 py-2 text-[13px] font-semibold text-white"
        >
          {t('book.viewTrip', { count: items.length })}
        </button>
      </div>
    </div>
  )
}

export function BookingSteps({ step }: { step: 1 | 2 | 3 }) {
  const { t } = useTranslation()
  const labels = [t('book.details.step1'), t('book.details.step2'), t('book.details.step3')]
  return (
    <ol className="mb-5 flex items-center gap-2 text-[12px] font-semibold">
      {labels.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'next'
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                state === 'next' ? 'border border-bord bg-paper text-sgraph' : 'bg-emer text-white'
              }`}
            >
              {state === 'done' ? '✓' : n}
            </span>
            <span className={state === 'next' ? 'text-sgraph' : 'text-graph'}>{label}</span>
            {n < 3 ? <span className="h-px flex-1 bg-bord" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

export function PageIntro({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string; children?: ReactNode }) {
  return (
    <header className="pt-3 pb-4 md:pt-6">
      {eyebrow ? <p className="mb-1 text-[10.5px] font-semibold tracking-[0.14em] text-emer uppercase">{eyebrow}</p> : null}
      <h1 className="text-[26px] font-bold tracking-[-0.5px] text-graph md:text-[32px]">{title}</h1>
      {body ? <p className="mt-1.5 max-w-2xl text-[14px] text-sgraph">{body}</p> : null}
      {children}
    </header>
  )
}

export const fieldCls =
  'min-h-11 w-full rounded-[13px] border border-bord bg-paper px-3 text-[14px] text-graph outline-none transition focus:border-fresh focus:ring-2 focus:ring-mint'

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11.5px] font-semibold tracking-[0.03em] text-sgraph">{label}</span>
      {children}
    </label>
  )
}

export function todayIso(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y!, m! - 1, d! + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function isIsoDate(v: string | null | undefined): v is string {
  return Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v))
}
