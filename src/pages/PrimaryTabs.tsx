import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clientV2Api } from '@/shared/api/clientV2'
import {
  Chip,
  ChipRow,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  SectionHeader,
} from '@/components/ui/Primitives'
import { PlaceCard } from '@/components/cards/Cards'

function PlaceRow({
  to,
  title,
  meta,
  imageUrl,
  badge,
}: {
  to: string
  title: string
  meta?: string | null
  imageUrl?: string | null
  badge?: string | null
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[18px] border border-bord bg-paper px-3 py-3 shadow-[var(--shadow-card)] transition active:scale-[0.99]"
    >
      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-[17px] bg-mist">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-bold text-graph">{title}</span>
          {badge ? (
            <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-extrabold text-forest">
              {badge}
            </span>
          ) : null}
        </span>
        {meta ? (
          <span className="mt-1 block truncate text-[12px] text-sgraph">
            {meta}
          </span>
        ) : null}
      </span>
      <span className="text-sgraph" aria-hidden>
        ›
      </span>
    </Link>
  )
}

/** Around me — Discovery walk buckets + Excel Vendor catalog. */
export function AroundPage() {
  const [category, setCategory] = useState<string | null>(null)
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'loading' | 'denied' | 'error' | 'ready'
  >('idle')

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (category) p.set('category', category)
    if (origin) {
      p.set('lat', String(origin.lat))
      p.set('lng', String(origin.lng))
    }
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [category, origin])

  const q = useQuery({
    queryKey: ['client-v2', 'around', qs],
    queryFn: () => clientV2Api.places(qs),
  })

  if (q.isLoading) return <LoadingBlock fill label="Around you" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed to load'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!
  const sections = data.sections || {}
  const sectionOrder: Array<{ key: string; title: string; seeAll?: string }> = [
    { key: 'under6', title: 'Under 6 minutes walk' },
    { key: 'shortWalk', title: 'A short walk' },
    { key: 'shortRide', title: 'A short ride' },
    {
      key: 'excelHotels',
      title: 'Hotels',
      seeAll: '/stays',
    },
    {
      key: 'excelActivities',
      title: 'Activities',
      seeAll: '/acts',
    },
    {
      key: 'excelGuides',
      title: 'Guides',
      seeAll: '/guides',
    },
  ]

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setGeoStatus('ready')
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    )
  }

  return (
    <div>
      <h1 className="text-[32px] leading-[1.15] font-bold tracking-[-0.45px] text-graph md:text-[30px]">
        Around me
      </h1>
      <p className="mt-2 text-sm text-sgraph">
        From {data.origin?.label ?? 'Red Square'} — walk distances plus hotels,
        activities, and guides.
      </p>

      <button
        type="button"
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-[16px] bg-emer text-sm font-semibold text-white md:max-w-xs disabled:opacity-60"
        disabled={geoStatus === 'loading'}
        onClick={requestLocation}
      >
        {geoStatus === 'loading' ? 'Locating…' : 'Use my location'}
      </button>
      {geoStatus === 'denied' ? (
        <p className="mt-2 text-[12.5px] text-sgraph">
          Location permission denied — showing Red Square distances.
        </p>
      ) : null}
      {geoStatus === 'error' ? (
        <p className="mt-2 text-[12.5px] text-sgraph">
          Could not read location — showing Red Square distances.
        </p>
      ) : null}
      {geoStatus === 'ready' ? (
        <p className="mt-2 text-[12.5px] text-emer">
          Distances updated from your location.
        </p>
      ) : null}

      {data.categories?.length ? (
        <div className="mt-4">
          <ChipRow>
            <Chip active={!category} onClick={() => setCategory(null)}>
              All
            </Chip>
            {data.categories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </Chip>
            ))}
          </ChipRow>
        </div>
      ) : null}

      {sectionOrder.map((sec) => {
        const items = sections[sec.key] || []
        if (!items.length) return null
        return (
          <div key={sec.key}>
            <SectionHeader
              title={sec.title}
              action={
                sec.seeAll ? (
                  <Link to={sec.seeAll} className="text-xs font-bold text-emer">
                    See all
                  </Link>
                ) : undefined
              }
            />
            <div className="space-y-2.5 md:hidden">
              {items.map((p) => (
                <PlaceRow
                  key={p.id || p.slug}
                  to={`/places/${encodeURIComponent(p.slug || p.id)}`}
                  title={p.title}
                  meta={
                    [
                      p.area,
                      p.distanceMeters != null && p.distanceMeters < 40_000
                        ? `${Math.round(p.distanceMeters)} m away`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || null
                  }
                  imageUrl={p.imageUrl}
                  badge={typeof p.badge === 'string' ? p.badge : null}
                />
              ))}
            </div>
            <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-3">
              {items.map((p) => (
                <PlaceCard
                  key={p.id || p.slug}
                  to={`/places/${encodeURIComponent(p.slug || p.id)}`}
                  title={p.title}
                  subtitle={
                    p.area ||
                    (p.distanceMeters != null && p.distanceMeters < 40_000
                      ? `${Math.round(p.distanceMeters)} m away`
                      : null)
                  }
                  imageUrl={p.imageUrl}
                  badge={typeof p.badge === 'string' ? p.badge : undefined}
                />
              ))}
            </div>
          </div>
        )
      })}

      {!sectionOrder.some((s) => (sections[s.key] || []).length) ? (
        <EmptyBlock
          title="Nothing nearby yet"
          body="Places and catalog partners will appear here."
        />
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link
          to="/stays"
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest"
        >
          All hotels
        </Link>
        <Link
          to="/acts"
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest"
        >
          All activities
        </Link>
        <Link
          to="/explore"
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest"
        >
          Explore Russia
        </Link>
      </div>
    </div>
  )
}

type DestRow = {
  id?: string
  slug?: string
  title?: string
  name?: string
  subtitle?: string
  area?: string
  imageUrl?: string | null
  statusTitle?: string
  kind?: string
  href?: string
  tags?: string[]
}

/** Explore — Discovery destinations + Excel Vendor catalog filters. */
export function ExplorePage() {
  const [filter, setFilter] = useState<string | null>(null)
  const qs = filter ? `?filter=${encodeURIComponent(filter)}` : ''

  const q = useQuery({
    queryKey: ['client-v2', 'explore', qs],
    queryFn: () =>
      clientV2Api.destinations(qs) as Promise<{
        filters?: Array<{ id: string; label: string; statusTitle?: string }>
        statusTitle?: string
        matchCount?: number
        data?: DestRow[]
      }>,
  })

  if (q.isLoading) return <LoadingBlock fill label="Explore" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed to load'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!
  const rows = data.data ?? []

  return (
    <div>
      <h1 className="text-[32px] leading-[1.12] font-bold tracking-[-0.45px] text-graph md:text-[36px]">
        Explore Russia
      </h1>
      <p className="mt-2 text-sm text-sgraph">
        {data.statusTitle ?? 'All'}
        {data.matchCount != null ? ` · ${data.matchCount} matches` : ''}
      </p>
      <p className="mt-1 text-[12.5px] text-sgraph">
        Filter by hotels, activities, guides, or cities.
      </p>

      {data.filters?.length ? (
        <div className="mt-4">
          <ChipRow>
            <Chip active={!filter} onClick={() => setFilter(null)}>
              All
            </Chip>
            {data.filters.map((f) => (
              <Chip
                key={f.id}
                active={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Chip>
            ))}
          </ChipRow>
        </div>
      ) : null}

      <SectionHeader
        title={
          filter === 'hotels'
            ? 'Hotels'
            : filter === 'activities'
              ? 'Activities'
              : filter === 'guides'
                ? 'Guides'
                : filter === 'cities'
                  ? 'Cities'
                  : 'Destinations'
        }
      />
      {rows.length === 0 ? (
        <EmptyBlock
          title="No matches"
          body="Try Hotels, Activities, Guides, or Cities filters."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {rows.map((d, i) => {
            const id = d.slug || d.id || String(i)
            const title = d.title || d.name || 'Destination'
            const to =
              d.href ||
              (d.kind === 'city' && d.title
                ? `/stays?city=${encodeURIComponent(d.title)}`
                : `/places/${encodeURIComponent(id)}`)
            const badge =
              d.kind === 'vendor'
                ? d.tags?.includes('hotel')
                  ? 'Hotel'
                  : d.tags?.includes('activity')
                    ? 'Activity'
                    : d.tags?.includes('guide')
                      ? 'Guide'
                      : undefined
                : d.kind === 'city'
                  ? 'City'
                  : undefined
            return (
              <PlaceCard
                key={id}
                layout="grid"
                to={to}
                title={title}
                subtitle={d.subtitle || d.area || d.statusTitle}
                imageUrl={d.imageUrl}
                badge={badge}
              />
            )
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link
          to="/stays"
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest"
        >
          Full hotel catalog
        </Link>
        <Link
          to="/acts"
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest"
        >
          Full activities
        </Link>
        <Link
          to="/guides"
          className="flex min-h-12 items-center justify-center rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest"
        >
          Full guides
        </Link>
      </div>
    </div>
  )
}

/** My Trip + Account live in CustomerAuthPages (ZN login + portal). */
