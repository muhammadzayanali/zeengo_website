import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { catalogApi, type ListingCard, type ListingDetail, type ListingType } from '@/shared/api/catalog'
import { useTripBag } from '@/shared/trip/TripBag'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/ui/Primitives'
import {
  addDaysIso,
  Field,
  fieldCls,
  isIsoDate,
  ListingCardView,
  PageIntro,
  PriceTag,
  SmartImage,
  Stars,
  todayIso,
  useLang,
} from '@/components/booking/BookingUi'

type Kind = 'hotel' | 'activity' | 'guide' | 'restaurant'

export const LISTING_CONFIG: Record<
  Kind,
  { type: ListingType; path: string; titleKey: string; bodyKey: string }
> = {
  hotel: { type: 'hotels', path: '/hotels', titleKey: 'book.hotelsTitle', bodyKey: 'book.hotelsBody' },
  activity: { type: 'activities', path: '/experiences', titleKey: 'book.experiencesTitle', bodyKey: 'book.experiencesBody' },
  guide: { type: 'guides', path: '/guides', titleKey: 'book.guidesTitle', bodyKey: 'book.guidesBody' },
  restaurant: { type: 'restaurants', path: '/restaurants', titleKey: 'book.restaurantsTitle', bodyKey: 'book.restaurantsBody' },
}

const SORTS: Record<Kind, string[]> = {
  hotel: ['recommended', 'price_asc', 'price_desc', 'stars', 'rating', 'distance'],
  activity: ['recommended', 'price_asc', 'price_desc', 'distance', 'name'],
  guide: ['recommended', 'price_asc', 'name'],
  restaurant: ['recommended', 'name'],
}

const PAGE_SIZE = 20
const RED_SQUARE = { lat: 55.7539, lng: 37.6208 }

function num(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Reads the tutu-style search state from the URL (also accepts home-module params). */
function useListingParams() {
  const [sp, setSp] = useSearchParams()
  const checkIn = sp.get('checkIn') ?? sp.get('date')
  const checkOut = sp.get('checkOut') ?? sp.get('dateTo')
  const state = {
    q: sp.get('q') ?? '',
    city: sp.get('city') ?? '',
    category: sp.get('category') ?? '',
    checkIn: isIsoDate(checkIn) ? checkIn : '',
    checkOut: isIsoDate(checkOut) && checkOut !== checkIn ? checkOut : '',
    people: num(sp.get('people')) ?? 2,
    rooms: num(sp.get('rooms')) ?? 1,
    stars: num(sp.get('stars')),
    priceMax: num(sp.get('priceMax')),
    withPhotos: sp.get('withPhotos') === 'true',
    sort: sp.get('sort') ?? 'recommended',
    page: num(sp.get('page')) ?? 1,
    lat: num(sp.get('lat')),
    lng: num(sp.get('lng')),
  }
  const update = (patch: Partial<Record<keyof typeof state, string | number | boolean | undefined>>, resetPage = true) => {
    setSp(
      (cur) => {
        const next = new URLSearchParams(cur)
        next.delete('date')
        next.delete('dateTo')
        next.delete('from')
        next.delete('to')
        if (state.checkIn && !next.has('checkIn')) next.set('checkIn', state.checkIn)
        if (state.checkOut && !next.has('checkOut')) next.set('checkOut', state.checkOut)
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === '' || v === false || v === null) next.delete(k)
          else next.set(k, String(v))
        }
        if (resetPage && !('page' in patch)) next.delete('page')
        return next
      },
      { replace: false },
    )
  }
  return { state, update }
}

function SearchBar({ kind, state, update, cities }: {
  kind: Kind
  state: ReturnType<typeof useListingParams>['state']
  update: ReturnType<typeof useListingParams>['update']
  cities: string[]
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(state)
  useEffect(() => setDraft(state), [state.q, state.city, state.checkIn, state.checkOut, state.people, state.rooms]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: FormEvent) => {
    e.preventDefault()
    let checkOut = draft.checkOut
    if (draft.checkIn && (!checkOut || checkOut <= draft.checkIn)) checkOut = kind === 'hotel' ? addDaysIso(draft.checkIn, 1) : ''
    update({
      q: draft.q.trim(),
      city: draft.city,
      checkIn: draft.checkIn,
      checkOut: kind === 'hotel' ? checkOut : '',
      people: draft.people,
      rooms: kind === 'hotel' && draft.rooms > 1 ? draft.rooms : undefined,
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-[20px] border border-bord bg-paper p-3 shadow-[var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
      <Field label={t('book.city')}>
        <select className={fieldCls} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })}>
          <option value="">{t('book.anyCity')}</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      {kind === 'hotel' || kind === 'activity' ? (
        <Field label={kind === 'hotel' ? t('book.checkIn') : t('book.date')}>
          <input type="date" className={fieldCls} min={todayIso()} value={draft.checkIn} onChange={(e) => setDraft({ ...draft, checkIn: e.target.value })} />
        </Field>
      ) : (
        <Field label={t('book.keyword')}>
          <input className={fieldCls} value={draft.q} placeholder={t('book.searchPlaceholder')} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
        </Field>
      )}
      {kind === 'hotel' ? (
        <Field label={t('book.checkOut')}>
          <input type="date" className={fieldCls} min={draft.checkIn || todayIso(1)} value={draft.checkOut} onChange={(e) => setDraft({ ...draft, checkOut: e.target.value })} />
        </Field>
      ) : kind === 'activity' ? (
        <Field label={t('book.keyword')}>
          <input className={fieldCls} value={draft.q} placeholder={t('book.searchPlaceholder')} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
        </Field>
      ) : null}
      {kind !== 'restaurant' ? (
        <Field label={t('book.guests')}>
          <select className={fieldCls} value={draft.people} onChange={(e) => setDraft({ ...draft, people: Number(e.target.value) })}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{t('book.guestsCount', { count: n })}</option>
            ))}
          </select>
        </Field>
      ) : null}
      <button type="submit" className="min-h-11 rounded-[13px] bg-emer px-6 text-[14.5px] font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)] hover:bg-[#1b5f46] sm:col-span-2 lg:col-span-1">
        {t('book.search')}
      </button>
    </form>
  )
}

export function ListingResultsPage({ kind }: { kind: Kind }) {
  const { t } = useTranslation()
  const lang = useLang()
  const cfg = LISTING_CONFIG[kind]
  const { state, update } = useListingParams()
  const [showFilters, setShowFilters] = useState(false)
  const [locating, setLocating] = useState(false)

  const query = useQuery({
    queryKey: ['browse', cfg.type, lang, state],
    queryFn: () =>
      catalogApi.list(cfg.type, {
        lang,
        q: state.q || undefined,
        city: state.city || undefined,
        category: state.category || undefined,
        stars: state.stars,
        priceMax: state.priceMax,
        withPhotos: state.withPhotos,
        sort: state.sort,
        lat: state.lat,
        lng: state.lng,
        checkIn: kind === 'hotel' && state.checkIn && state.checkOut ? state.checkIn : undefined,
        checkOut: kind === 'hotel' && state.checkIn && state.checkOut ? state.checkOut : undefined,
        rooms: kind === 'hotel' ? state.rooms : undefined,
        people: kind === 'activity' ? state.people : undefined,
        page: state.page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  const data = query.data
  const cities = useMemo(() => (data?.cities ?? []).map((c) => c.value), [data?.cities])
  const pages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  const detailQs = new URLSearchParams()
  if (state.checkIn) detailQs.set('checkIn', state.checkIn)
  if (state.checkOut) detailQs.set('checkOut', state.checkOut)
  if (state.people !== 2) detailQs.set('people', String(state.people))
  if (state.rooms > 1) detailQs.set('rooms', String(state.rooms))
  const suffix = detailQs.toString() ? `?${detailQs}` : ''

  const chooseSort = (sort: string) => {
    if (sort !== 'distance') return update({ sort })
    if (state.lat && state.lng) return update({ sort })
    setLocating(true)
    const done = (lat: number, lng: number) => {
      setLocating(false)
      update({ sort, lat: lat.toFixed(5), lng: lng.toFixed(5) })
    }
    if (!navigator.geolocation) return done(RED_SQUARE.lat, RED_SQUARE.lng)
    navigator.geolocation.getCurrentPosition(
      (pos) => done(pos.coords.latitude, pos.coords.longitude),
      () => done(RED_SQUARE.lat, RED_SQUARE.lng),
      { timeout: 8000, maximumAge: 300_000 },
    )
  }

  const activeFilters = Boolean(state.stars || state.priceMax || state.withPhotos || state.category)

  const filters = (
    <div className="space-y-5">
      {kind === 'hotel' ? (
        <div>
          <p className="mb-2 text-[12px] font-bold tracking-[0.06em] text-graph uppercase">{t('book.stars')}</p>
          <div className="flex flex-wrap gap-1.5">
            {[undefined, 3, 4, 5].map((n) => (
              <button
                key={n ?? 'any'}
                type="button"
                onClick={() => update({ stars: n })}
                className={`rounded-[11px] border px-3 py-1.5 text-[12.5px] font-semibold ${state.stars === n ? 'border-[#cfe3d9] bg-mint text-forest' : 'border-bord bg-paper text-sgraph'}`}
              >
                {n ? t('book.starsPlus', { n }) : t('book.anyStars')}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {kind === 'activity' && data?.categories.length ? (
        <div>
          <p className="mb-2 text-[12px] font-bold tracking-[0.06em] text-graph uppercase">{t('book.category')}</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => update({ category: '' })} className={`rounded-[11px] border px-3 py-1.5 text-[12.5px] font-semibold ${!state.category ? 'border-[#cfe3d9] bg-mint text-forest' : 'border-bord bg-paper text-sgraph'}`}>
              {t('all')}
            </button>
            {data.categories.map((c) => (
              <button key={c.value} type="button" onClick={() => update({ category: c.value })} className={`rounded-[11px] border px-3 py-1.5 text-[12.5px] font-semibold ${state.category === c.value ? 'border-[#cfe3d9] bg-mint text-forest' : 'border-bord bg-paper text-sgraph'}`}>
                {c.value} <span className="opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {kind === 'hotel' || kind === 'activity' || kind === 'guide' ? (
        <div>
          <p className="mb-2 text-[12px] font-bold tracking-[0.06em] text-graph uppercase">{t('book.priceUpTo')}</p>
          <select className={fieldCls} value={state.priceMax ?? ''} onChange={(e) => update({ priceMax: e.target.value || undefined })}>
            <option value="">{t('book.anyPrice')}</option>
            {(kind === 'hotel' ? [5000, 10000, 20000, 40000, 80000] : [2000, 5000, 10000, 20000, 50000]).map((n) => (
              <option key={n} value={n}>₽{n.toLocaleString('en-US')}</option>
            ))}
          </select>
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-[13.5px] font-medium text-graph">
        <input type="checkbox" className="h-4 w-4 accent-[#1f6b4f]" checked={state.withPhotos} onChange={(e) => update({ withPhotos: e.target.checked })} />
        {t('book.withPhotos')}
      </label>
      {activeFilters ? (
        <button type="button" onClick={() => update({ stars: undefined, priceMax: undefined, withPhotos: undefined, category: '' })} className="text-[13px] font-bold text-forest underline">
          {t('book.clearFilters')}
        </button>
      ) : null}
    </div>
  )

  return (
    <div>
      <PageIntro eyebrow="aLo · ZEEN" title={t(cfg.titleKey)} body={t(cfg.bodyKey)} />
      <SearchBar kind={kind} state={state} update={update} cities={cities} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[250px_1fr]">
        <aside className="hidden self-start rounded-[20px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-24 lg:block">
          <p className="mb-4 text-[15px] font-bold text-graph">{t('book.filters')}</p>
          {filters}
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13.5px] font-semibold text-sgraph">
              {data ? t('book.resultsCount', { count: data.count }) : '\u00a0'}
              {data?.nights ? ` · ${t('book.nightsCount', { count: data.nights })}` : ''}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters((v) => !v)} className="min-h-10 rounded-[12px] border border-bord bg-paper px-3 text-[13px] font-semibold text-graph lg:hidden">
                {t('book.filters')}{activeFilters ? ' •' : ''}
              </button>
              <select aria-label={t('book.sortBy')} className={`${fieldCls} min-h-10 w-auto`} value={state.sort} onChange={(e) => chooseSort(e.target.value)}>
                {SORTS[kind].map((s) => (
                  <option key={s} value={s}>{t(`book.sort.${s}`)}</option>
                ))}
              </select>
            </div>
          </div>
          {showFilters ? <div className="mb-4 rounded-[20px] border border-bord bg-paper p-4 lg:hidden">{filters}</div> : null}
          {locating ? <p className="mb-2 text-[12.5px] text-sgraph">{t('around.locating')}</p> : null}

          {query.isLoading ? (
            <LoadingBlock />
          ) : query.isError ? (
            <ErrorBlock message={(query.error as Error).message} onRetry={() => void query.refetch()} />
          ) : !data?.data.length ? (
            <EmptyBlock title={t('book.noResults')} body={t('book.noResultsHint')} />
          ) : (
            <div className={`space-y-3 transition-opacity ${query.isFetching ? 'opacity-60' : ''}`}>
              {data.data.map((item) => (
                <ListingCardView key={item.id} item={item} to={`${cfg.path}/${item.id}${suffix}`} />
              ))}
              {pages > 1 ? (
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button type="button" disabled={state.page <= 1} onClick={() => { update({ page: state.page - 1 }, false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="min-h-10 rounded-[12px] border border-bord bg-paper px-4 text-[13px] font-semibold disabled:opacity-40">
                    {t('catalog.prev')}
                  </button>
                  <span className="text-[13px] text-sgraph">{state.page} / {pages}</span>
                  <button type="button" disabled={state.page >= pages} onClick={() => { update({ page: state.page + 1 }, false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="min-h-10 rounded-[12px] border border-bord bg-paper px-4 text-[13px] font-semibold disabled:opacity-40">
                    {t('catalog.next')}
                  </button>
                </div>
              ) : null}
              <p className="pt-2 text-center text-[11.5px] text-sgraph">{t('book.indicative')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  useEffect(() => setActive(0), [images])
  if (!images.length) return <SmartImage src={null} alt={title} className="aspect-[16/8] w-full rounded-[22px]" />
  return (
    <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
      <SmartImage src={images[active]} fallbacks={images} alt={title} className="aspect-[16/10] w-full rounded-[22px] md:aspect-auto md:h-[360px]" />
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:grid-rows-2">
          {images.slice(0, 8).map((src, i) =>
            i === active ? null : (
              <button key={src} type="button" onClick={() => setActive(i)} className="overflow-hidden rounded-[14px]">
                <SmartImage src={src} alt="" className="aspect-square w-full md:aspect-auto md:h-[176px]" />
              </button>
            ),
          ).filter(Boolean).slice(0, 4)}
        </div>
      ) : null}
    </div>
  )
}

export function ListingDetailPage({ kind }: { kind: Kind }) {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const cfg = LISTING_CONFIG[kind]
  const { add } = useTripBag()
  const [sp, setSp] = useSearchParams()

  const checkIn = isIsoDate(sp.get('checkIn')) ? sp.get('checkIn')! : ''
  const checkOut = isIsoDate(sp.get('checkOut')) ? sp.get('checkOut')! : ''
  const people = num(sp.get('people')) ?? 2
  const rooms = num(sp.get('rooms')) ?? 1
  const [date, setDate] = useState(checkIn || '')
  const [time, setTime] = useState('')
  const [dateError, setDateError] = useState(false)

  const setParam = (patch: Record<string, string | number | undefined>) =>
    setSp((cur) => {
      const next = new URLSearchParams(cur)
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') next.delete(k)
        else next.set(k, String(v))
      }
      return next
    }, { replace: true })

  const query = useQuery({
    queryKey: ['browse-item', id, lang, checkIn, checkOut, rooms, people],
    queryFn: () =>
      catalogApi.detail(id, {
        lang,
        checkIn: checkIn && checkOut ? checkIn : undefined,
        checkOut: checkIn && checkOut ? checkOut : undefined,
        rooms,
        people,
      }),
    placeholderData: keepPreviousData,
    enabled: Boolean(id),
  })

  if (query.isLoading) return <LoadingBlock />
  if (query.isError || !query.data) {
    return (
      <div className="pt-6">
        <ErrorBlock message={(query.error as Error | null)?.message ?? t('book.notFound')} onRetry={() => void query.refetch()} />
        <Link to={cfg.path} className="mt-4 inline-block text-sm font-bold text-forest underline"><span className="inline-block rtl:rotate-180">←</span> {t(cfg.titleKey)}</Link>
      </div>
    )
  }
  const v: ListingDetail = query.data
  const stayReady = Boolean(checkIn && checkOut && checkOut > checkIn)

  const addHotel = (room?: ListingDetail['rooms'][number]) => {
    if (!stayReady) {
      setDateError(true)
      document.getElementById('stay-dates')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    add({
      request: {
        kind: 'hotel',
        vendorId: v.id,
        roomId: room?.id,
        title: room ? `${v.titleEn} — ${room.name}` : v.titleEn,
        checkIn,
        checkOut,
        rooms,
        pax: people,
      },
      display: {
        title: room ? `${v.title} · ${room.name}` : v.title,
        subtitle: [v.city, t('book.guestsCount', { count: people })].join(' · '),
        imageUrl: room?.images[0] ?? v.imageUrl,
        dateLabel: `${checkIn} → ${checkOut}`,
        price: room?.price?.estimate ?? v.price?.estimate ?? null,
      },
    })
  }

  const addService = () => {
    if (!date) {
      setDateError(true)
      return
    }
    add({
      request: {
        kind,
        vendorId: v.id,
        title: v.titleEn,
        serviceDate: date,
        time: time || undefined,
        pax: people,
      },
      display: {
        title: v.title,
        subtitle: [v.city, t('book.guestsCount', { count: people })].join(' · '),
        imageUrl: v.imageUrl,
        dateLabel: time ? `${date} · ${time}` : date,
        price: v.price?.unit === 'person' ? { amount: v.price.from * people, currency: v.price.currency, basis: `${people} × ${v.price.from.toLocaleString('en-US')}`, indicative: true } : null,
      },
    })
  }

  const place = [v.area, v.address, v.city].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(' · ')
  const mapUrl = v.yandexMapsUrl || (v.lat != null && v.lng != null ? `https://yandex.com/maps/?pt=${v.lng},${v.lat}&z=16&l=map` : null)

  return (
    <div className="pb-8">
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(cfg.path))} className="mb-3 mt-2 text-[13px] font-bold text-forest">
        <span className="inline-block rtl:rotate-180">←</span> {t(cfg.titleKey)}
      </button>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Gallery images={v.images} title={v.title} />
          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Stars n={v.stars} />
                {v.category ? <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold text-sgraph">{v.category}</span> : null}
              </div>
              <h1 className="mt-1 text-[26px] font-bold tracking-[-0.5px] text-graph md:text-[30px]">{v.title}</h1>
              {v.title !== v.titleEn ? <p className="text-[13px] text-sgraph">{v.titleEn}</p> : null}
              {place ? <p className="mt-1 text-[13.5px] text-sgraph">{place}</p> : null}
            </div>
            {v.rating ? (
              <div className="shrink-0 text-center">
                <span className="block rounded-[12px] bg-forest px-2.5 py-1.5 text-[15px] font-bold text-white">{v.rating.toFixed(1)}</span>
                {v.ratingCount ? <span className="mt-1 block text-[10.5px] text-sgraph">{t('book.reviews', { count: v.ratingCount })}</span> : null}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-[12px] border border-bord bg-paper px-3 py-2 text-[12.5px] font-semibold text-graph">{t('book.openMap')}</a> : null}
            {v.website ? <a href={v.website} target="_blank" rel="noreferrer" className="rounded-[12px] border border-bord bg-paper px-3 py-2 text-[12.5px] font-semibold text-graph">{t('book.website')}</a> : null}
            {v.durationLabel ? <span className="rounded-[12px] bg-mist px-3 py-2 text-[12.5px] font-semibold text-sgraph">{v.durationLabel}</span> : null}
            {v.languages ? <span className="rounded-[12px] bg-mist px-3 py-2 text-[12.5px] font-semibold text-sgraph">{v.languages}</span> : null}
          </div>
          {v.summary ? (
            <section className="mt-5">
              <h2 className="mb-1.5 text-[17px] font-bold text-graph">{t('book.about')}</h2>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-sgraph">{v.summary}</p>
            </section>
          ) : null}

          {kind === 'hotel' ? (
            <section className="mt-6">
              <h2 className="mb-3 text-[19px] font-bold text-graph">{t('book.roomsTitle')}</h2>
              {v.rooms.length ? (
                <div className="space-y-3">
                  {v.rooms.map((room) => (
                    <article key={room.id} className="flex flex-col gap-3 rounded-[18px] border border-bord bg-paper p-3 shadow-[var(--shadow-card)] sm:flex-row">
                      <SmartImage src={room.images[0]} alt={room.name} className="aspect-[16/10] w-full shrink-0 rounded-[14px] sm:h-[120px] sm:w-[180px] sm:aspect-auto" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <h3 className="text-[15.5px] font-bold text-graph">{room.name}</h3>
                        <div className="flex flex-wrap gap-1.5 text-[11.5px] text-sgraph">
                          {room.sizeM2 ? <span className="rounded-full border border-bord px-2 py-0.5">{room.sizeM2} m²</span> : null}
                          {room.beds ? <span className="rounded-full border border-bord px-2 py-0.5">{room.beds}</span> : null}
                          {room.maxGuests ? <span className="rounded-full border border-bord px-2 py-0.5">{t('book.maxGuests', { n: room.maxGuests })}</span> : null}
                          {room.breakfast ? <span className="rounded-full bg-mint px-2 py-0.5 text-forest">{t('book.breakfast')}</span> : null}
                          {room.refundable ? <span className="rounded-full bg-mint px-2 py-0.5 text-forest">{t('book.refundable')}</span> : null}
                        </div>
                        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                          <PriceTag price={room.price} align="start" />
                          <button type="button" onClick={() => addHotel(room)} className="min-h-10 shrink-0 rounded-[12px] bg-emer px-4 text-[13.5px] font-semibold text-white">
                            {t('book.addToTrip')}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyBlock title={t('book.noRooms')} />
              )}
            </section>
          ) : null}

          {v.nearby.length ? (
            <section className="mt-8">
              <h2 className="mb-3 text-[17px] font-bold text-graph">{t('book.nearby')}</h2>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                {v.nearby.map((n: ListingCard) => (
                  <Link key={n.id} to={`${cfg.path}/${n.id}${sp.toString() ? `?${sp}` : ''}`} className="w-[220px] shrink-0 overflow-hidden rounded-[18px] border border-bord bg-paper shadow-[var(--shadow-card)] md:w-auto">
                    <SmartImage src={n.imageUrl} fallbacks={n.images} alt={n.title} className="aspect-[16/10] w-full" />
                    <div className="p-3">
                      <p className="line-clamp-1 text-[14px] font-bold text-graph">{n.title}</p>
                      <p className="text-[12px] text-sgraph">{n.distanceKm != null ? `${n.distanceKm} km` : n.city}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside id="stay-dates" className="self-start rounded-[22px] border border-bord bg-paper p-4 shadow-[var(--shadow-lift)] lg:sticky lg:top-24">
          <div className="mb-3">
            <PriceTag price={v.price} align="start" />
          </div>
          {kind === 'hotel' ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('book.checkIn')}>
                <input type="date" className={fieldCls} min={todayIso()} value={checkIn} onChange={(e) => { setDateError(false); setParam({ checkIn: e.target.value, checkOut: checkOut && checkOut > e.target.value ? checkOut : addDaysIso(e.target.value, 1) }) }} />
              </Field>
              <Field label={t('book.checkOut')}>
                <input type="date" className={fieldCls} min={checkIn ? addDaysIso(checkIn, 1) : todayIso(1)} value={checkOut} onChange={(e) => { setDateError(false); setParam({ checkOut: e.target.value }) }} />
              </Field>
              <Field label={t('book.guests')}>
                <select className={fieldCls} value={people} onChange={(e) => setParam({ people: e.target.value })}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label={t('book.rooms')}>
                <select className={fieldCls} value={rooms} onChange={(e) => setParam({ rooms: e.target.value })}>
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('book.date')}>
                <input type="date" className={fieldCls} min={todayIso()} value={date} onChange={(e) => { setDateError(false); setDate(e.target.value) }} />
              </Field>
              <Field label={t('book.time')}>
                <input type="time" className={fieldCls} value={time} onChange={(e) => setTime(e.target.value)} />
              </Field>
              <Field label={t('book.guests')} className="col-span-2">
                <select className={fieldCls} value={people} onChange={(e) => setParam({ people: e.target.value })}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{t('book.guestsCount', { count: n })}</option>)}
                </select>
              </Field>
            </div>
          )}
          {dateError ? <p className="mt-2 text-[12.5px] font-semibold text-[#C0392B]">{kind === 'hotel' ? t('book.pickStayDates') : t('book.pickDate')}</p> : null}
          <button
            type="button"
            onClick={() => (kind === 'hotel' ? addHotel(v.rooms.length === 1 ? v.rooms[0] : undefined) : addService())}
            className="mt-3 min-h-12 w-full rounded-[14px] bg-emer px-4 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)]"
          >
            {kind === 'hotel' && v.rooms.length > 1 ? t('book.requestAnyRoom') : t('book.addToTrip')}
          </button>
          <p className="mt-2 text-[11.5px] leading-snug text-sgraph">{t('book.indicative')}</p>
        </aside>
      </div>
    </div>
  )
}
