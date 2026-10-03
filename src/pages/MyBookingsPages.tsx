import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/auth/AuthContext'
import { catalogApi, formatMoney, type ClientBookingDetail } from '@/shared/api/catalog'
import { normalizeZnCode } from '@/shared/auth/session'
import { ErrorBlock, LoadingBlock } from '@/components/ui/Primitives'
import { PageIntro, SmartImage, useLang } from '@/components/booking/BookingUi'
import { ZnLoginForm } from '@/pages/CustomerAuthPages'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[#FFF4DC] text-[#8A5A00]',
  under_review: 'bg-[#E6F0FB] text-[#1D4E89]',
  confirmed: 'bg-mint text-forest',
  rejected: 'bg-[#FBEAE8] text-[#C0392B]',
  cancelled: 'bg-[#EEE] text-sgraph',
  completed: 'bg-mint text-forest',
}

function statusKey(b: Pick<ClientBookingDetail, 'status' | 'requestStatus'>) {
  if (b.status === 'cancelled' && b.requestStatus !== 'rejected') return 'cancelled'
  if (b.status === 'completed') return 'completed'
  return b.requestStatus
}

function StatusBadge({ booking }: { booking: Pick<ClientBookingDetail, 'status' | 'requestStatus'> }) {
  const { t } = useTranslation()
  const key = statusKey(booking)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-bold ${STATUS_STYLE[key] ?? 'bg-mist text-sgraph'}`}>
      {t(`book.bookings.status.${key}`)}
    </span>
  )
}

function useMyBooking(enabled: boolean) {
  return useQuery({
    queryKey: ['client', 'booking'],
    queryFn: () => catalogApi.myBooking(),
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

function formatWhen(iso: string, lang: string) {
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SignInPanel({ target }: { target?: string }) {
  const { t } = useTranslation()
  const { znCode } = useAuth()
  return (
    <div className="mx-auto max-w-lg space-y-3">
      {znCode && target && znCode !== target ? (
        <p className="rounded-[14px] bg-mist px-3 py-2 text-[13px] text-graph">{t('book.bookings.otherBooking', { zn: znCode, target })}</p>
      ) : (
        <p className="text-[14px] text-sgraph">{t('book.bookings.signIn')}</p>
      )}
      <ZnLoginForm />
    </div>
  )
}

export function MyBookingsPage() {
  const { t } = useTranslation()
  const { ready, isAuthenticated } = useAuth()
  const booking = useMyBooking(ready && isAuthenticated)

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <PageIntro title={t('book.bookings.title')} />
      {!ready ? (
        <LoadingBlock />
      ) : !isAuthenticated ? (
        <SignInPanel />
      ) : booking.isLoading ? (
        <LoadingBlock />
      ) : booking.isError || !booking.data ? (
        <ErrorBlock message={(booking.error as Error | null)?.message ?? 'Error'} onRetry={() => void booking.refetch()} />
      ) : (
        <Link to={`/bookings/${booking.data.znCode}`} className="block rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[22px] font-bold tracking-[1px] text-graph" dir="ltr">{booking.data.znCode}</p>
              <p className="text-[13px] text-sgraph">{booking.data.arrivalDate} → {booking.data.departureDate} · {t('book.bookings.itemsCount', { count: booking.data.items.length })}</p>
            </div>
            <StatusBadge booking={booking.data} />
          </div>
          <p className="mt-3 text-[13px] font-bold text-forest">{t('book.bookings.open')} <span className="inline-block rtl:rotate-180">→</span></p>
        </Link>
      )}
    </div>
  )
}

export function BookingStatusPage() {
  const { zn = '' } = useParams()
  const target = normalizeZnCode(zn)
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const { ready, isAuthenticated, znCode } = useAuth()
  const matches = isAuthenticated && znCode === target
  const booking = useMyBooking(ready && matches)

  if (!ready) return <LoadingBlock />
  if (!matches) {
    return (
      <div className="pb-10">
        <PageIntro title={target} />
        <SignInPanel target={target} />
      </div>
    )
  }
  if (booking.isLoading) return <LoadingBlock />
  if (booking.isError || !booking.data) {
    return <ErrorBlock message={(booking.error as Error | null)?.message ?? 'Error'} onRetry={() => void booking.refetch()} />
  }
  const b = booking.data
  const key = statusKey(b)

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <button type="button" onClick={() => navigate('/bookings')} className="mb-2 mt-2 text-[13px] font-bold text-forest"><span className="inline-block rtl:rotate-180">←</span> {t('book.bookings.title')}</button>
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-[22px] bg-gradient-to-br from-forest to-emer p-5 text-white">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">{t('book.confirm.yourCode')}</p>
          <p className="text-[32px] font-bold tracking-[1.5px]" dir="ltr">{b.znCode}</p>
          <p className="text-[13px] opacity-85">{b.arrivalDate} → {b.departureDate} · {t('book.guestsCount', { count: b.partySize + b.childrenCount })}</p>
        </div>
        <span className="rounded-full bg-white/95 px-3 py-1.5 text-[12.5px] font-bold text-forest">{t(`book.bookings.status.${key}`)}</span>
      </header>

      {b.requestStatus === 'rejected' && b.rejectionReason ? (
        <p className="mt-4 rounded-[14px] bg-[#FBEAE8] px-4 py-3 text-[13.5px] text-[#8E2B20]">
          <span className="font-bold">{t('book.bookings.reason')}: </span>{b.rejectionReason}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 text-[17px] font-bold text-graph">{t('book.bookings.items')}</h2>
          {b.items.length ? (
            <ul className="space-y-2">
              {b.items.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-[18px] border border-bord bg-paper p-3 shadow-[var(--shadow-card)]">
                  <SmartImage src={i.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-[12px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10.5px] font-bold tracking-[0.1em] text-emer uppercase">{t(`book.kind.${i.kind}`, { defaultValue: i.kind })}</p>
                      <span className="rounded-full bg-mist px-2 py-0.5 text-[10.5px] font-semibold text-sgraph">{t(`book.itemStatus.${i.status}`, { defaultValue: i.status })}</span>
                    </div>
                    <p className="text-[14.5px] font-semibold text-graph">{i.title}</p>
                    {i.description ? <p className="text-[12.5px] text-sgraph">{i.description}</p> : null}
                    <div className="mt-1 flex justify-between gap-2 text-[12px] text-sgraph">
                      <span>{i.date}</span>
                      {i.indicativePrice ? (
                        <span>
                          {t('book.from')} <span className="font-semibold text-graph">{formatMoney(i.indicativePrice.amount, i.indicativePrice.currency, lang)}</span> · {t('book.indicativeShort')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[16px] bg-mist p-4 text-[13.5px] text-sgraph">{t('book.bookings.noItems')}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/trip" className="rounded-[12px] border border-bord bg-paper px-3 py-2 text-[13px] font-semibold text-graph">{t('book.bookings.trip')}</Link>
            <Link to="/hotels" className="rounded-[12px] border border-bord bg-paper px-3 py-2 text-[13px] font-semibold text-graph">+ {t('book.bookings.addMore')}</Link>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[15px] font-bold text-graph">{t('book.bookings.timeline')}</h2>
            <ol className="relative space-y-4 border-s-2 border-mint ps-4">
              {b.timeline.map((s, idx) => (
                <li key={`${s.key}-${idx}`} className="relative">
                  <span className={`absolute -start-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-paper ${s.key === 'rejected' || s.key === 'cancelled' ? 'bg-[#C0392B]' : 'bg-emer'}`} />
                  <p className="text-[13.5px] font-semibold text-graph">{t(`book.timeline.${s.key}`, { defaultValue: s.title })}</p>
                  {s.detail ? <p className="text-[12px] text-sgraph">{s.detail}</p> : null}
                  <p className="text-[11px] text-sgraph">{formatWhen(s.at, lang)}</p>
                </li>
              ))}
              {key === 'pending' || key === 'under_review' ? (
                <li className="relative">
                  <span className="absolute -start-[23px] top-1 h-3 w-3 rounded-full border-2 border-emer bg-paper ring-4 ring-paper" />
                  <p className="text-[13.5px] font-semibold text-sgraph">{t('book.timeline.next_confirm')}</p>
                </li>
              ) : null}
            </ol>
          </section>
          <section className="rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
            <h2 className="mb-2 text-[15px] font-bold text-graph">{t('book.bookings.balance')}</h2>
            {b.balance.total > 0 ? (
              <dl className="space-y-1 text-[13.5px]">
                <div className="flex justify-between"><dt className="text-sgraph">{t('book.bookings.total')}</dt><dd className="font-semibold">{formatMoney(b.balance.total, 'RUB', lang)}</dd></div>
                <div className="flex justify-between"><dt className="text-sgraph">{t('book.bookings.paid')}</dt><dd className="font-semibold">{formatMoney(b.balance.paid, 'RUB', lang)}</dd></div>
                <div className="flex justify-between border-t border-bord pt-1"><dt className="font-semibold">{t('book.bookings.due')}</dt><dd className="font-bold text-forest">{formatMoney(b.balance.due, 'RUB', lang)}</dd></div>
              </dl>
            ) : (
              <p className="text-[13px] text-sgraph">{t('book.bookings.priceComing')}</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
