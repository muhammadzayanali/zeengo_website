import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  clientV2Api,
  type ActivityItem,
  type CarItem,
  type CatalogQuery,
  type GuideItem,
  type HotelItem,
  type RestaurantItem,
} from '@/shared/api/clientV2'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  InlineLoader,
  SectionHeader,
} from '@/components/ui/Primitives'
import { PlaceCard } from '@/components/cards/Cards'
import { CatalogRequestButton } from '@/components/catalog/CatalogRequestButton'

const PAGE_SIZE = 48

function useBookingQuery(): CatalogQuery {
  const [params] = useSearchParams()
  return useMemo(
    () => ({
      q: params.get('q') || undefined,
      people: params.get('people') ? Number(params.get('people')) : undefined,
      date: params.get('date') || undefined,
      dateTo: params.get('dateTo') || undefined,
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
      city: params.get('city') || undefined,
      page: params.get('page') ? Number(params.get('page')) : 1,
      limit: PAGE_SIZE,
    }),
    [params],
  )
}

function useCatalogParams() {
  const [params, setParams] = useSearchParams()
  const query = useBookingQuery()

  const setFilter = (patch: { q?: string; city?: string; page?: number }) => {
    const next = new URLSearchParams(params)
    if (patch.q !== undefined) {
      if (patch.q) next.set('q', patch.q)
      else next.delete('q')
    }
    if (patch.city !== undefined) {
      if (patch.city) next.set('city', patch.city)
      else next.delete('city')
    }
    if (patch.page !== undefined) {
      if (patch.page > 1) next.set('page', String(patch.page))
      else next.delete('page')
    }
    setParams(next, { replace: true })
  }

  return { query, setFilter, params }
}

function TripSummary({ query }: { query: CatalogQuery }) {
  const bits = [
    query.from ? `From ${query.from}` : null,
    query.to ? `To ${query.to}` : null,
    query.date ? query.date : null,
    query.people ? `${query.people} people` : null,
    query.q ? `“${query.q}”` : null,
  ].filter(Boolean)
  if (!bits.length) return null
  return <p className="mt-2 text-sm text-sgraph">{bits.join(' · ')}</p>
}

function CatalogToolbar({
  cities,
  count,
  query,
  onSearch,
  onCity,
  onPage,
  placeholder,
}: {
  cities: string[]
  count: number
  query: CatalogQuery
  onSearch: (q: string) => void
  onCity: (city: string | undefined) => void
  onPage: (page: number) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState(query.q || '')
  useEffect(() => {
    setDraft(query.q || '')
  }, [query.q])

  const page = query.page ?? 1
  const limit = query.limit ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(count / limit))

  return (
    <div className="mt-4 space-y-3">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSearch(draft.trim())
        }}
      >
        <label className="flex min-h-10 flex-1 items-center gap-2 rounded-[12px] border border-bord bg-paper px-3 shadow-[var(--shadow-card)] focus-within:border-fresh/40">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="shrink-0 text-sgraph"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16.2 16.2 3.3 3.3" strokeLinecap="round" />
          </svg>
          <input
            className="w-full border-0 bg-transparent py-2 text-[13.5px] text-graph outline-none placeholder:text-sgraph"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Search catalog"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] bg-emer px-3.5 text-[13px] font-semibold text-white"
        >
          Search
        </button>
      </form>

      {cities.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCity(undefined)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
              !query.city
                ? 'bg-emer text-white'
                : 'border border-bord bg-paper text-forest'
            }`}
          >
            All cities
          </button>
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCity(c)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                query.city === c
                  ? 'bg-emer text-white'
                  : 'border border-bord bg-paper text-forest'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-sgraph">
        <p>
          {count.toLocaleString()} results
          {query.city ? ` · ${query.city}` : ''}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
        </p>
        {totalPages > 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
              className="rounded-full border border-bord bg-paper px-3 py-1 font-semibold text-forest disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPage(page + 1)}
              className="rounded-full border border-bord bg-paper px-3 py-1 font-semibold text-forest disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CarsPage() {
  const query = useBookingQuery()
  const q = useQuery({
    queryKey: ['client-v2', 'cars', query],
    queryFn: () => clientV2Api.cars(query),
  })

  if (q.isLoading) return <LoadingBlock fill label="Cars & drivers" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!
  const drivers = data.data.filter((c) => c.kind === 'driver')
  const classes = data.data.filter((c) => c.kind === 'class')

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px] text-graph">
        Cars with a driver
      </h1>
      <TripSummary query={query} />
      <p className="mt-2 max-w-2xl text-sm text-sgraph">
        Request a car style via WhatsApp — ZEEN Ops assigns and your driver
        confirms on My trip. Driver chat unlocks after they accept.
      </p>

      <SectionHeader title="Available drivers" eyebrow="DB" />
      {drivers.length === 0 ? (
        <EmptyBlock
          title="No live drivers yet"
          body="Driver profiles in Postgres will appear here when status is available."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((c) => (
            <DriverCard key={c.id} item={c} query={query} />
          ))}
        </div>
      )}

      <SectionHeader title="Vehicle classes" eyebrow="Move" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <DriverCard key={c.id} item={c} query={query} />
        ))}
      </div>

      <p className="mt-6 text-xs text-sgraph">{data.ctaHint}</p>
    </div>
  )
}

function DriverCard({ item, query }: { item: CarItem; query: CatalogQuery }) {
  return (
    <div className="flex flex-col rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-graph">{item.title}</p>
          <p className="mt-1 text-[12.5px] text-sgraph">{item.subtitle}</p>
        </div>
        {item.priceLabel ? (
          <span className="shrink-0 rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-forest">
            {item.priceLabel}
          </span>
        ) : item.rating ? (
          <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-emer">
            ★ {item.rating}
          </span>
        ) : null}
      </div>
      <CatalogRequestButton
        label="Request booking"
        payload={{
          kind: 'car',
          itemId: item.id,
          carKind: item.kind,
          title: item.title,
          detail: [item.subtitle, item.vehicle, item.priceLabel]
            .filter(Boolean)
            .join(' · '),
          context: {
            date: query.date,
            dateTo: query.dateTo,
            from: query.from,
            to: query.to,
            people: query.people,
          },
        }}
      />
    </div>
  )
}

export function StaysCatalogPage() {
  const { query, setFilter } = useCatalogParams()
  const q = useQuery({
    queryKey: ['client-v2', 'hotels', query],
    queryFn: () => clientV2Api.hotels(query),
  })

  if (q.isLoading) return <LoadingBlock fill label="Stays" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px] text-graph">
        Stays
      </h1>
      <TripSummary query={query} />
      <p className="mt-2 max-w-2xl text-sm text-sgraph">
        Hotels from the ZEEN catalog. Request a quote with your ZN code — ZEEN
        desk confirms on your booking.
      </p>

      <CatalogToolbar
        cities={data.cities ?? []}
        count={data.count}
        query={query}
        placeholder="Search hotel or city…"
        onSearch={(text) => setFilter({ q: text, page: 1 })}
        onCity={(city) => setFilter({ city, page: 1 })}
        onPage={(page) => setFilter({ page })}
      />

      <SectionHeader title="Hotels & hostels" eyebrow="Catalog" />
      {data.data.length === 0 ? (
        <EmptyBlock
          title="No hotels match"
          body="Try another city or clear search."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((h) => (
            <HotelCard key={h.id} item={h} query={query} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-sgraph">{data.ctaHint}</p>
    </div>
  )
}

function HotelCard({ item, query }: { item: HotelItem; query: CatalogQuery }) {
  return (
    <div className="flex flex-col rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
        {item.city}
      </p>
      <p className="mt-1 text-[15px] font-bold text-graph">{item.title}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-sgraph">
        {item.subtitle}
      </p>
      <CatalogRequestButton
        label="Request booking"
        payload={{
          kind: 'stay',
          title: item.title,
          detail: item.subtitle,
          context: {
            date: query.date,
            dateTo: query.dateTo,
            people: query.people,
            city: item.city ?? query.city,
          },
        }}
      />
    </div>
  )
}

export function ActivitiesCatalogPage() {
  const { query, setFilter } = useCatalogParams()
  const q = useQuery({
    queryKey: ['client-v2', 'activities', query],
    queryFn: () => clientV2Api.activities(query),
  })

  if (q.isLoading) return <LoadingBlock fill label="Activities" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px] text-graph">
        Things to do
      </h1>
      <TripSummary query={query} />
      <p className="mt-2 max-w-2xl text-sm text-sgraph">
        Activities from the ZEEN catalog. Request with your ZN code — ZEEN desk
        adds it to your trip.
      </p>

      <CatalogToolbar
        cities={data.cities ?? []}
        count={data.count}
        query={query}
        placeholder="Search activity or city…"
        onSearch={(text) => setFilter({ q: text, page: 1 })}
        onCity={(city) => setFilter({ city, page: 1 })}
        onPage={(page) => setFilter({ page })}
      />

      <SectionHeader title="Activities" eyebrow="Catalog" />
      {data.data.length === 0 ? (
        <EmptyBlock
          title="No activities match"
          body="Try another city or clear search."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((a) => (
            <ActivityCard key={a.id} item={a} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-sgraph">{data.ctaHint}</p>
    </div>
  )
}

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <div className="flex flex-col rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
        {item.city}
      </p>
      <p className="mt-1 text-[15px] font-bold text-graph">{item.title}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-sgraph">
        {item.subtitle}
      </p>
      <CatalogRequestButton
        label="Request booking"
        payload={{
          kind: 'activity',
          title: item.title,
          detail: item.subtitle,
          context: { city: item.city },
        }}
      />
    </div>
  )
}

export function GuidesCatalogPage() {
  const { query, setFilter } = useCatalogParams()
  const q = useQuery({
    queryKey: ['client-v2', 'guides', query],
    queryFn: () => clientV2Api.guides(query),
  })

  if (q.isLoading) return <LoadingBlock fill label="Guides" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px] text-graph">
        Guides
      </h1>
      <TripSummary query={query} />
      <p className="mt-2 max-w-2xl text-sm text-sgraph">
        Guides from the ZEEN catalog. Request with your ZN code.
      </p>

      <CatalogToolbar
        cities={data.cities ?? []}
        count={data.count}
        query={query}
        placeholder="Search guide or city…"
        onSearch={(text) => setFilter({ q: text, page: 1 })}
        onCity={(city) => setFilter({ city, page: 1 })}
        onPage={(page) => setFilter({ page })}
      />

      <SectionHeader title="Arabic-speaking guides" eyebrow="Catalog" />
      {data.data.length === 0 ? (
        <EmptyBlock
          title="No guides match"
          body="Try another city or clear search."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((g) => (
            <GuideCard key={g.id} item={g} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-sgraph">{data.ctaHint}</p>
    </div>
  )
}

function GuideCard({ item }: { item: GuideItem }) {
  return (
    <div className="flex flex-col rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
        {item.city}
      </p>
      <p className="mt-1 text-[15px] font-bold text-graph">{item.title}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-sgraph">
        {item.subtitle}
      </p>
      {item.phone ? (
        <p className="mt-1 text-[12px] font-semibold text-forest">{item.phone}</p>
      ) : null}
      <CatalogRequestButton
        label="Request booking"
        payload={{
          kind: 'guide',
          title: item.title,
          detail: [item.subtitle, item.phone].filter(Boolean).join(' · '),
          context: { city: item.city },
        }}
      />
    </div>
  )
}

export function FoodCatalogPage() {
  const { query, setFilter } = useCatalogParams()
  const q = useQuery({
    queryKey: ['client-v2', 'restaurants', query],
    queryFn: () => clientV2Api.restaurants(query),
  })

  if (q.isLoading) return <LoadingBlock fill label="Food" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!
  const vendors = data.data.filter((r) => r.kind === 'restaurant')
  const places = data.data.filter((r) => r.kind === 'place')

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px] text-graph">
        Where to eat
      </h1>
      <TripSummary query={query} />
      <p className="mt-2 max-w-2xl text-sm text-sgraph">
        Restaurants from Vendor DB plus curated Discovery food places. Request a
        table with your ZN code inside the app.
      </p>

      <CatalogToolbar
        cities={data.cities ?? []}
        count={data.count}
        query={query}
        placeholder="Search restaurant…"
        onSearch={(text) => setFilter({ q: text, page: 1 })}
        onCity={(city) => setFilter({ city, page: 1 })}
        onPage={(page) => setFilter({ page })}
      />

      <SectionHeader title="Restaurants" eyebrow="DB" />
      {vendors.length === 0 ? (
        <EmptyBlock title="No restaurants" body="Add Vendor type=restaurant." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((r) => (
            <RestaurantCard key={r.id} item={r} />
          ))}
        </div>
      )}

      {places.length ? (
        <>
          <SectionHeader title="Curated food spots" eyebrow="Discovery" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((r) => (
              <PlaceCard
                key={r.id}
                to={r.slug ? `/places/${encodeURIComponent(r.slug)}` : '/food'}
                title={r.title}
                subtitle={r.subtitle}
                imageUrl={r.imageUrl}
                badge={r.halalFriendly ? 'Halal' : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function RestaurantCard({ item }: { item: RestaurantItem }) {
  return (
    <div className="flex flex-col rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
          {item.city}
        </p>
        {item.halalFriendly ? (
          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-forest">
            Halal
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[15px] font-bold text-graph">{item.title}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-sgraph">
        {item.subtitle}
      </p>
      <CatalogRequestButton
        label="Request booking"
        payload={{
          kind: 'food',
          title: item.title,
          detail: item.subtitle,
          context: { city: item.city ?? undefined },
        }}
      />
    </div>
  )
}

export function SearchCatalogPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const qParam = params.get('q')?.trim() || ''
  const [draft, setDraft] = useState(qParam)

  useEffect(() => {
    setDraft(qParam)
  }, [qParam])

  const q = useQuery({
    queryKey: ['client-v2', 'search', qParam],
    queryFn: () => clientV2Api.search(qParam),
    enabled: qParam.length > 0,
  })

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px]">Search</h1>
      <p className="mt-2 text-sm text-sgraph">
        Search stays, activities, guides, food, and places from the database.
      </p>
      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const next = draft.trim()
          navigate(next ? `/search?q=${encodeURIComponent(next)}` : '/search')
        }}
      >
        <label className="flex min-h-10 flex-1 items-center gap-2 rounded-[12px] border border-bord bg-paper px-3 shadow-[var(--shadow-card)] focus-within:border-fresh/40">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="shrink-0 text-sgraph"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16.2 16.2 3.3 3.3" strokeLinecap="round" />
          </svg>
          <input
            className="w-full border-0 bg-transparent py-2 text-[13.5px] text-graph outline-none placeholder:text-sgraph"
            placeholder="Try hotel, activity, guide…"
            aria-label="Search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] bg-emer px-3.5 text-[13px] font-semibold text-white"
        >
          Search
        </button>
      </form>

      {!qParam ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Link
            className="rounded-[16px] border border-bord bg-paper p-4 font-semibold shadow-[var(--shadow-card)]"
            to="/stays"
          >
            Stays
          </Link>
          <Link
            className="rounded-[16px] border border-bord bg-paper p-4 font-semibold shadow-[var(--shadow-card)]"
            to="/acts"
          >
            Activities
          </Link>
          <Link
            className="rounded-[16px] border border-bord bg-paper p-4 font-semibold shadow-[var(--shadow-card)]"
            to="/guides"
          >
            Guides
          </Link>
          <Link
            className="rounded-[16px] border border-bord bg-paper p-4 font-semibold shadow-[var(--shadow-card)]"
            to="/food"
          >
            Food
          </Link>
        </div>
      ) : null}

      {qParam && q.isLoading ? <InlineLoader label="Search" /> : null}
      {qParam && q.isError ? (
        <ErrorBlock
          message={q.error instanceof Error ? q.error.message : 'Search failed'}
          onRetry={() => void q.refetch()}
        />
      ) : null}

      {q.data ? (
        <div className="mt-6 space-y-6">
          <ResultGroup title="Places" items={q.data.places} />
          <ResultGroup title="Destinations" items={q.data.destinations} />
          <ResultGroup
            title="Hotels"
            items={q.data.hotels.map((h) => ({
              id: h.id,
              title: h.title,
              subtitle: h.subtitle,
              to: '/stays',
            }))}
          />
          <ResultGroup
            title="Activities"
            items={(q.data.activities ?? []).map((a) => ({
              id: a.id,
              title: a.title,
              subtitle: a.subtitle,
              to: '/acts',
            }))}
          />
          <ResultGroup
            title="Guides"
            items={(q.data.guides ?? []).map((g) => ({
              id: g.id,
              title: g.title,
              subtitle: g.subtitle,
              to: '/guides',
            }))}
          />
          <ResultGroup
            title="Restaurants"
            items={q.data.restaurants.map((r) => ({
              id: r.id,
              title: r.title,
              subtitle: r.subtitle,
              to: r.to,
            }))}
          />
        </div>
      ) : null}
    </div>
  )
}

function ResultGroup({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; title: string; subtitle?: string; to: string }>
}) {
  if (!items.length) return null
  return (
    <div>
      <SectionHeader title={title} />
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={`${title}-${item.id}`}
            to={item.to}
            className="block rounded-[16px] border border-bord bg-paper px-4 py-3 shadow-[var(--shadow-card)]"
          >
            <p className="font-semibold text-graph">{item.title}</p>
            {item.subtitle ? (
              <p className="mt-0.5 text-xs text-sgraph">{item.subtitle}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
