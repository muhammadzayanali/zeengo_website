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
import { CatalogRequestButton } from '@/components/catalog/CatalogRequestButton'

export function PlacesPage({
  title = 'Around Moscow',
  homeRail,
}: {
  title?: string
  homeRail?: string
}) {
  const [category, setCategory] = useState<string | null>(null)
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (homeRail) p.set('homeRail', homeRail)
    if (category) p.set('category', category)
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [category, homeRail])

  const q = useQuery({
    queryKey: ['client-v2', 'places', qs],
    queryFn: () => clientV2Api.places(qs),
  })

  if (q.isLoading) return <LoadingBlock fill />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed to load'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const data = q.data!
  const flat =
    data.places ??
    Object.values(data.sections || {}).flat()

  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px] text-graph">
        {title}
      </h1>
      <p className="mt-2 text-sm text-sgraph">
        Distances from {data.origin?.label ?? 'Red Square'}.
      </p>

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

      <SectionHeader title="Places" />
      {flat.length === 0 ? (
        <EmptyBlock
          title="No places yet"
          body="Publish Discovery places in PostgreSQL (seed-client-v2) or adjust filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flat.map((p) => (
            <PlaceCard
              key={p.id || p.slug}
              to={`/places/${encodeURIComponent(p.slug || p.id)}`}
              title={p.title}
              subtitle={
                p.area ||
                (p.distanceMeters != null
                  ? `${Math.round(p.distanceMeters / 100) / 10} km`
                  : null)
              }
              imageUrl={p.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlaceDetailPage({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ['client-v2', 'place', id],
    queryFn: () => clientV2Api.place(id),
  })

  if (q.isLoading) return <LoadingBlock fill />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Not found'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  const p = q.data as {
    title?: string
    description?: string
    area?: string
    imageUrl?: string
    category?: string
    kind?: string
  }

  const bookKind =
    p.category === 'Stay' || p.kind === 'hotel'
      ? 'stay'
      : p.category === 'Food' || p.kind === 'restaurant'
        ? 'food'
        : p.category === 'Guide' || p.kind === 'guide'
          ? 'guide'
          : 'activity'

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/places" className="text-sm font-semibold text-emer">
        ← Places
      </Link>
      <div className="mt-3 overflow-hidden rounded-[22px] border border-bord bg-paper shadow-[var(--shadow-card)]">
        <div className="h-56 bg-gradient-to-br from-mist via-[#e8f3ed] to-mint md:h-72">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
        </div>
        <div className="p-5 md:p-6">
          {p.category ? (
            <p className="text-[11px] font-bold tracking-wide text-emer uppercase">
              {p.category}
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold text-graph md:text-3xl">
            {p.title}
          </h1>
          {p.area ? <p className="mt-2 text-sgraph">{p.area}</p> : null}
          {p.description ? (
            <p className="mt-4 text-[15px] leading-relaxed text-graph">
              {p.description}
            </p>
          ) : null}
          {p.title ? (
            <CatalogRequestButton
              label="Book on WhatsApp"
              payload={{
                kind: bookKind,
                title: p.title,
                detail: p.description ?? p.area,
                context: { city: p.area },
              }}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}
