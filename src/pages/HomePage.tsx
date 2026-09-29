import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clientV2Api, type HomeChip, type HomeFeed } from '@/shared/api/clientV2'
import { fetchCbrFx, rubPerUnit } from '@/shared/api/cbrFx'
import {
  ErrorBlock,
  LoadingBlock,
  SectionHeader,
} from '@/components/ui/Primitives'
import { CardRail, PlaceCard } from '@/components/cards/Cards'
import { AloBookingModule } from '@/components/home/AloBookingModule'
import { MoneyTodayStrip } from '@/components/money/MoneyConverter'

const SERVICE_LINKS: Record<string, string> = {
  stays: '/stays',
  hotels: '/stays',
  cars: '/cars',
  places: '/around',
  around: '/around',
  food: '/food',
  acts: '/acts',
  activities: '/acts',
  things: '/acts',
  explore: '/explore',
  train: '/train',
  trains: '/train',
  money: '/money',
  fx: '/money',
  day: '/trip',
  trip: '/trip',
  ask: '/search',
  now: '/around',
  live: '/around',
  guides: '/guides',
  guide: '/guides',
  happening: '/around',
}

const FALLBACK_SERVICES: HomeChip[] = [
  { id: 'acts', label: 'Things to do', subtitle: 'Activities' },
  { id: 'hotels', label: 'Hotels', subtitle: 'Hotels' },
  { id: 'cars', label: 'Cars & drivers', subtitle: 'Drivers + vehicle classes' },
  { id: 'guides', label: 'Guide service', subtitle: 'Guides' },
  { id: 'money', label: 'Money now', subtitle: 'Live ₽ rates & paying' },
  { id: 'now', label: 'Happening now', subtitle: 'Around you in Moscow' },
]

function moscowClock() {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  } catch {
    return '--:--'
  }
}

function ServiceCard({
  id,
  label,
  subtitle,
}: {
  id: string
  label: string
  subtitle?: string | null
}) {
  const to =
    SERVICE_LINKS[id] ||
    SERVICE_LINKS[label.toLowerCase().replace(/\s+/g, '')] ||
    '/explore'
  return (
    <Link
      to={to}
      className="flex min-h-[112px] flex-col items-start gap-3 rounded-[18px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)] transition active:scale-[0.98] md:min-h-[122px]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-mint">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1F6B4F"
          strokeWidth="1.9"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold tracking-[-0.15px] text-graph">
          {label}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-sgraph">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

function HomeTopBar() {
  const time = useMemo(() => moscowClock(), [])
  const fxQ = useQuery({
    queryKey: ['cbr-fx'],
    queryFn: fetchCbrFx,
    staleTime: 30 * 60_000,
    retry: 1,
  })
  const sar = fxQ.data?.rates.SAR
  const sarRate = sar
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rubPerUnit(sar))
    : null

  return (
    <div className="mb-3 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-emer uppercase">
            aLo · ZEEN
          </p>
          <p className="mt-1 text-[22px] font-bold tracking-[-0.35px] text-graph">
            aLo Russia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/around"
            className="inline-flex min-h-9 items-center rounded-full border border-bord bg-paper px-3 text-xs font-semibold text-forest shadow-[var(--shadow-card)]"
          >
            Moscow
          </Link>
          <Link
            to="/money"
            className="inline-flex min-h-9 items-center rounded-full bg-mist px-3 text-xs font-bold text-emer"
          >
            {sarRate ? `1 SAR ${sarRate}₽` : '₽ FX'}
          </Link>
          <Link
            to="/trip"
            className="inline-flex min-h-9 items-center rounded-full bg-emer px-3 text-xs font-bold text-white"
          >
            Trip
          </Link>
        </div>
      </div>
      <p className="mt-2 text-[12.5px] text-sgraph">
        {time} in Moscow · Arabic-speaking desk
      </p>
    </div>
  )
}

function HomeBody({ data }: { data: HomeFeed }) {
  const services =
    data.services?.length > 0 ? data.services : FALLBACK_SERVICES

  return (
    <>
      <section className="mb-6 md:mb-8">
        <div className="relative md:overflow-hidden md:rounded-[28px] md:border md:border-bord md:bg-gradient-to-br md:from-mist md:via-ivory md:to-[#e8f3ed] md:px-7 md:py-8 md:shadow-[var(--shadow-card)] lg:px-10 lg:py-10">
          <div
            className="pointer-events-none absolute -top-24 -right-16 hidden h-64 w-64 rounded-full bg-mint/50 blur-3xl md:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-10 hidden h-48 w-48 rounded-full bg-[#cfe6db]/40 blur-3xl md:block"
            aria-hidden
          />
          <div className="relative">
            <div className="mb-6 hidden md:block">
              <p className="text-[12px] font-bold tracking-[0.2em] text-emer uppercase">
                Moscow · Arabic desk
              </p>
              <h1 className="mt-2 max-w-2xl text-[40px] leading-[1.08] font-bold tracking-[-0.6px] text-graph lg:text-[46px]">
                Where to today?
              </h1>
              <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-sgraph">
                Arabic-speaking guide to Moscow — stays, things to do, transfers,
                and live rouble rates.
              </p>
            </div>
            <AloBookingModule quickChips={data.quickChips} />
          </div>
        </div>
      </section>

      <MoneyTodayStrip />

      <SectionHeader title="Services" eyebrow="01" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {services.map((s) => (
          <ServiceCard
            key={s.id}
            id={s.id}
            label={s.label}
            subtitle={s.subtitle}
          />
        ))}
      </div>

      {(data.featuredHotels?.length ?? 0) > 0 ? (
        <>
          <SectionHeader
            title="Hotels"
            eyebrow="DB"
            action={
              <Link to="/stays" className="text-xs font-bold text-emer">
                See all {data.catalogStats?.hotels ?? ''}
              </Link>
            }
          />
          <CardRail>
            {data.featuredHotels!.map((p) => (
              <PlaceCard
                key={String(p.id)}
                to={`/places/${encodeURIComponent(String(p.id))}`}
                title={p.title}
                subtitle={p.area || p.subtitle}
                badge={typeof p.badge === 'string' ? p.badge : 'Hotel'}
              />
            ))}
          </CardRail>
        </>
      ) : null}

      {(data.featuredActivities?.length ?? 0) > 0 ? (
        <>
          <SectionHeader
            title="Activities"
            eyebrow="DB"
            action={
              <Link to="/acts" className="text-xs font-bold text-emer">
                See all {data.catalogStats?.activities ?? ''}
              </Link>
            }
          />
          <CardRail>
            {data.featuredActivities!.map((p) => (
              <PlaceCard
                key={String(p.id)}
                to={`/places/${encodeURIComponent(String(p.id))}`}
                title={p.title}
                subtitle={p.area || p.subtitle}
                badge={typeof p.badge === 'string' ? p.badge : 'Activity'}
              />
            ))}
          </CardRail>
        </>
      ) : null}

      {(data.suitYou?.length ?? 0) > 0 ? (
        <>
          <SectionHeader title="What suits you today?" eyebrow="02" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.suitYou.map((m) => (
              <Link
                key={m.id}
                to="/explore"
                className="rounded-[16px] border border-bord bg-paper px-4 py-3.5 shadow-[var(--shadow-card)]"
              >
                <p className="font-semibold text-graph">{m.label}</p>
                {m.subtitle ? (
                  <p className="mt-1 text-xs text-sgraph">{m.subtitle}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <SectionHeader
        title="Moscow right now"
        eyebrow="03"
        action={
          <Link to="/around" className="text-xs font-bold text-emer">
            See all
          </Link>
        }
      />
      {(data.moscowNow?.length ?? 0) === 0 ? (
        <p className="text-sm text-sgraph">No curated places yet.</p>
      ) : (
        <CardRail>
          {data.moscowNow.map((p) => (
            <PlaceCard
              key={String(p.id)}
              to={`/places/${encodeURIComponent(String(p.id))}`}
              title={p.title}
              subtitle={p.area || p.subtitle}
              imageUrl={p.imageUrl}
              badge={p.badge}
            />
          ))}
        </CardRail>
      )}

      <SectionHeader title="Close to the centre" eyebrow="04" />
      <CardRail>
        {(data.closeToCentre ?? []).map((p) => (
          <PlaceCard
            key={String(p.id)}
            to={`/places/${encodeURIComponent(String(p.id))}`}
            title={p.title}
            subtitle={p.area || p.subtitle}
            imageUrl={p.imageUrl}
          />
        ))}
      </CardRail>

      <SectionHeader title="First time in Russia" eyebrow="05" />
      <CardRail>
        {(data.firstTime ?? []).map((p) => (
          <PlaceCard
            key={String(p.id)}
            to={`/places/${encodeURIComponent(String(p.id))}`}
            title={p.title}
            subtitle={p.area || p.subtitle}
            imageUrl={p.imageUrl}
          />
        ))}
      </CardRail>

      <SectionHeader title="Where to eat" eyebrow="06" />
      <CardRail>
        {(data.food ?? []).map((p) => (
          <PlaceCard
            key={p.id}
            to={`/places/${encodeURIComponent(p.id)}`}
            title={p.title}
            subtitle={p.location || p.description}
            imageUrl={p.imageUrl}
            badge={p.halalFriendly ? 'Halal-friendly' : undefined}
          />
        ))}
      </CardRail>

      <SectionHeader title="With kids" eyebrow="07" />
      <CardRail>
        {(data.withKids ?? []).map((p) => (
          <PlaceCard
            key={String(p.id)}
            to={`/places/${encodeURIComponent(String(p.id))}`}
            title={p.title}
            subtitle={p.area || p.subtitle}
            imageUrl={p.imageUrl}
          />
        ))}
      </CardRail>
    </>
  )
}

export function HomePage() {
  const q = useQuery({
    queryKey: ['client-v2', 'home'],
    queryFn: () => clientV2Api.home(),
  })

  if (q.isLoading) return <LoadingBlock fill label="Moscow" />
  if (q.isError) {
    return (
      <ErrorBlock
        message={q.error instanceof Error ? q.error.message : 'Failed to load'}
        onRetry={() => void q.refetch()}
      />
    )
  }
  if (!q.data) {
    return (
      <ErrorBlock
        message="Empty home response from API"
        onRetry={() => void q.refetch()}
      />
    )
  }

  return (
    <div>
      <HomeTopBar />
      <HomeBody data={q.data} />
    </div>
  )
}
