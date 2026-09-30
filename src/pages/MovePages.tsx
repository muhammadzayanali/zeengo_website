import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { catalogApi, type TransferService } from '@/shared/api/catalog'
import { useTripBag } from '@/shared/trip/TripBag'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/ui/Primitives'
import { Field, fieldCls, isIsoDate, PageIntro, PriceTag, todayIso, useLang } from '@/components/booking/BookingUi'

const SERVICES: TransferService[] = ['airport', 'hourly', 'day']
const AIRPORTS = ['Sheremetyevo (SVO)', 'Domodedovo (DME)', 'Vnukovo (VKO)', 'Pulkovo (LED)', 'Kazan (KZN)', 'Sochi (AER)']

function useParamState() {
  const [sp, setSp] = useSearchParams()
  const get = (k: string) => sp.get(k) ?? ''
  const set = (patch: Record<string, string | number | undefined>) =>
    setSp((cur) => {
      const next = new URLSearchParams(cur)
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') next.delete(k)
        else next.set(k, String(v))
      }
      return next
    }, { replace: true })
  return { get, set }
}

export function TransportPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { add } = useTripBag()
  const { get, set } = useParamState()

  const service = (SERVICES.includes(get('service') as TransferService) ? get('service') : 'airport') as TransferService
  const people = Math.max(1, Math.min(45, Number(get('people')) || 2))
  const bags = get('bags') ? Math.max(0, Number(get('bags'))) : undefined
  const hours = Math.max(1, Math.min(24, Number(get('hours')) || 3))
  const rawDate = get('date')
  const date = isIsoDate(rawDate) ? rawDate : ''
  const [from, setFrom] = useState(get('from') && get('from') !== 'Your location in Moscow' ? get('from') : '')
  const [to, setTo] = useState(get('to'))
  const [time, setTime] = useState(get('time'))
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['transport', lang, service, hours, people, bags],
    queryFn: () => catalogApi.transport({ lang, service, hours: service === 'hourly' ? hours : undefined, people, bags }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  const choose = (id: string) => {
    const vc = query.data?.data.find((c) => c.id === id)
    if (!vc) return
    if (!date) return setError(t('book.pickDate'))
    if (!from.trim()) return setError(t('book.pickPickup'))
    if (service === 'airport' && !to.trim()) return setError(t('book.pickDropoff'))
    setError(null)
    const serviceLabel = t(`book.service.${service}`)
    add({
      request: {
        kind: 'transfer',
        vehicleClassId: vc.id,
        transferService: service,
        hours: service === 'hourly' ? hours : undefined,
        title: `${serviceLabel} · ${vc.titleEn}`,
        serviceDate: date,
        time: time || undefined,
        from: from.trim(),
        to: to.trim() || undefined,
        pax: people,
        detail: bags != null ? `${bags} bags` : undefined,
      },
      display: {
        title: `${serviceLabel} · ${vc.title}`,
        subtitle: [from, to].filter(Boolean).join(' → '),
        dateLabel: time ? `${date} · ${time}` : date,
        price: vc.price,
      },
    })
  }

  return (
    <div className="pb-8">
      <PageIntro eyebrow="aLo · ZEEN" title={t('book.transportTitle')} body={t('book.transportBody')} />
      <div className="rounded-[20px] border border-bord bg-paper p-3 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex gap-1.5 overflow-x-auto scrollbar-none" role="tablist">
          {SERVICES.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={service === s} onClick={() => set({ service: s })} className={`shrink-0 rounded-[12px] px-3.5 py-2 text-[13px] font-semibold ${service === s ? 'bg-mint text-forest' : 'bg-mist text-sgraph'}`}>
              {t(`book.service.${s}`)}
            </button>
          ))}
        </div>
        <datalist id="airports">
          {AIRPORTS.map((a) => <option key={a} value={a} />)}
        </datalist>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Field label={t('book.pickup')} className="lg:col-span-2">
            <input className={fieldCls} list="airports" value={from} placeholder={service === 'airport' ? AIRPORTS[0] : t('book.pickupHint')} onChange={(e) => setFrom(e.target.value)} onBlur={() => set({ from })} />
          </Field>
          <Field label={t('book.dropoff')} className="lg:col-span-2">
            <input className={fieldCls} list="airports" value={to} placeholder={t('book.dropoffHint')} onChange={(e) => setTo(e.target.value)} onBlur={() => set({ to })} />
          </Field>
          <Field label={t('book.date')}>
            <input type="date" className={fieldCls} min={todayIso()} value={date} onChange={(e) => { setError(null); set({ date: e.target.value }) }} />
          </Field>
          <Field label={t('book.time')}>
            <input type="time" className={fieldCls} value={time} onChange={(e) => setTime(e.target.value)} onBlur={() => set({ time })} />
          </Field>
          <Field label={t('book.passengers')}>
            <select className={fieldCls} value={people} onChange={(e) => set({ people: e.target.value })}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 15, 19, 30, 45].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label={t('book.bags')}>
            <select className={fieldCls} value={bags ?? ''} onChange={(e) => set({ bags: e.target.value })}>
              <option value="">—</option>
              {[0, 1, 2, 3, 4, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          {service === 'hourly' ? (
            <Field label={t('book.hours')}>
              <select className={fieldCls} value={hours} onChange={(e) => set({ hours: e.target.value })}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-3 rounded-[12px] bg-[#FBEAE8] px-3 py-2 text-[13px] font-semibold text-[#C0392B]" role="alert">{error}</p> : null}

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingBlock />
        ) : query.isError ? (
          <ErrorBlock message={(query.error as Error).message} onRetry={() => void query.refetch()} />
        ) : !query.data?.data.length ? (
          <EmptyBlock title={t('book.noVehicles')} body={t('book.noVehiclesHint')} />
        ) : (
          <div className={`grid gap-3 md:grid-cols-2 ${query.isFetching ? 'opacity-60' : ''}`}>
            {query.data.data.map((vc) => (
              <article key={vc.id} className="flex flex-col gap-2 rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10.5px] font-bold tracking-[0.12em] text-emer uppercase">{vc.group}</p>
                    <h3 className="text-[17px] font-bold text-graph">{vc.title}</h3>
                    <p className="text-[12.5px] text-sgraph">{vc.models}</p>
                  </div>
                  <PriceTag estimate={vc.price} />
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11.5px] text-sgraph">
                  <span className="rounded-full border border-bord px-2 py-0.5">{t('book.seats', { n: vc.maxPax })}</span>
                  {vc.maxBags != null ? <span className="rounded-full border border-bord px-2 py-0.5">{t('book.bagsCount', { n: vc.maxBags })}</span> : null}
                  {vc.note ? <span className="rounded-full bg-mist px-2 py-0.5">{vc.note}</span> : null}
                </div>
                <button type="button" onClick={() => choose(vc.id)} className="mt-1 min-h-11 rounded-[13px] bg-emer text-[14px] font-semibold text-white">
                  {t('book.addToTrip')}
                </button>
              </article>
            ))}
          </div>
        )}
        <p className="pt-3 text-center text-[11.5px] text-sgraph">{t('book.transportNote')}</p>
      </div>
    </div>
  )
}

export function TrainsPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { add } = useTripBag()
  const { get, set } = useParamState()
  const people = Math.max(1, Math.min(20, Number(get('people')) || 1))
  const rawDate = get('date')
  const date = isIsoDate(rawDate) ? rawDate : ''
  const [to, setTo] = useState(get('to'))
  const [classes, setClasses] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['trains', lang, get('to'), people],
    queryFn: () => catalogApi.trains({ lang, to: get('to') || undefined, people }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  const choose = (id: string) => {
    const route = query.data?.data.find((r) => r.id === id)
    if (!route) return
    if (!date) return setError(t('book.pickDate'))
    setError(null)
    const trainClass = classes[id] ?? route.classes[0]
    add({
      request: {
        kind: 'train',
        trainRouteId: route.id,
        trainClass,
        title: `${route.titleEn}${route.typeLabel ? ` · ${route.typeLabel}` : ''}`,
        serviceDate: date,
        pax: people,
      },
      display: {
        title: route.title,
        subtitle: [route.typeLabel, trainClass].filter(Boolean).join(' · '),
        dateLabel: date,
        price: route.price,
      },
    })
  }

  return (
    <div className="pb-8">
      <PageIntro eyebrow="aLo · ZEEN" title={t('book.trainsTitle')} body={t('book.trainsBody')} />
      <form onSubmit={(e) => { e.preventDefault(); set({ to }) }} className="grid gap-2 rounded-[20px] border border-bord bg-paper p-3 shadow-[var(--shadow-card)] sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
        <Field label={t('book.toStation')}>
          <input className={fieldCls} value={to} placeholder="Saint Petersburg, Kazan…" onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label={t('book.date')}>
          <input type="date" className={fieldCls} min={todayIso()} value={date} onChange={(e) => { setError(null); set({ date: e.target.value }) }} />
        </Field>
        <Field label={t('book.passengers')}>
          <select className={fieldCls} value={people} onChange={(e) => set({ people: e.target.value })}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <button type="submit" className="min-h-11 rounded-[13px] bg-emer px-6 text-[14.5px] font-semibold text-white">{t('book.search')}</button>
      </form>
      {error ? <p className="mt-3 rounded-[12px] bg-[#FBEAE8] px-3 py-2 text-[13px] font-semibold text-[#C0392B]" role="alert">{error}</p> : null}

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingBlock />
        ) : query.isError ? (
          <ErrorBlock message={(query.error as Error).message} onRetry={() => void query.refetch()} />
        ) : !query.data?.data.length ? (
          <EmptyBlock title={t('book.noTrains')} body={t('book.noResultsHint')} />
        ) : (
          <div className={`space-y-3 ${query.isFetching ? 'opacity-60' : ''}`}>
            {query.data.data.map((r) => (
              <article key={r.id} className="grid gap-3 rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)] md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold tracking-[0.12em] text-emer uppercase">{r.typeLabel ?? r.type}</p>
                  <h3 className="text-[17px] font-bold text-graph">{r.title}</h3>
                  <p className="text-[12.5px] text-sgraph">{r.fromStation} → {r.toStation}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px] text-sgraph">
                    {r.duration ? <span className="rounded-full border border-bord px-2 py-0.5">{r.duration}</span> : null}
                    {r.departures ? <span className="rounded-full border border-bord px-2 py-0.5">{r.departures}</span> : null}
                    {r.operator ? <span className="rounded-full bg-mist px-2 py-0.5">{r.operator}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3 md:flex-col md:items-end">
                  <PriceTag estimate={r.price} />
                  <div className="flex gap-2">
                    {r.classes.length ? (
                      <select aria-label={t('book.trainClass')} className={`${fieldCls} min-h-10 w-auto`} value={classes[r.id] ?? r.classes[0]} onChange={(e) => setClasses({ ...classes, [r.id]: e.target.value })}>
                        {r.classes.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : null}
                    <button type="button" onClick={() => choose(r.id)} className="min-h-10 rounded-[12px] bg-emer px-4 text-[13.5px] font-semibold text-white">{t('book.addToTrip')}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="pt-3 text-center text-[11.5px] text-sgraph">{t('book.indicative')}</p>
      </div>
    </div>
  )
}
