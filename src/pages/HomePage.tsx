import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  { id: 'acts', label: 'Things to do', subtitle: 'Tickets & days out' },
  { id: 'hotels', label: 'Hotels', subtitle: 'Rooms in the city' },
  { id: 'cars', label: 'Cars & drivers', subtitle: 'Airport & hourly' },
  { id: 'guides', label: 'Guide service', subtitle: 'Arabic-speaking' },
  { id: 'money', label: 'Money now', subtitle: 'Live ₽ rates' },
  { id: 'now', label: 'Happening now', subtitle: 'Around you' },
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

function ServiceGlyph({ id }: { id: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  const key = id.toLowerCase()
  if (key.includes('hotel') || key.includes('stay')) {
    return (
      <svg {...common}>
        <path d="M4 19V9.5L12 5l8 4.5V19" />
        <path d="M9 19v-5h6v5" />
      </svg>
    )
  }
  if (key.includes('car') || key.includes('driver')) {
    return (
      <svg {...common}>
        <path d="M4 14h16l-1.4-5.2A2 2 0 0 0 16.7 7H7.3a2 2 0 0 0-1.9 1.8L4 14Z" />
        <circle cx="7.5" cy="16.5" r="1.5" />
        <circle cx="16.5" cy="16.5" r="1.5" />
      </svg>
    )
  }
  if (key.includes('food') || key.includes('eat')) {
    return (
      <svg {...common}>
        <path d="M7 4v8M5 4v5a2 2 0 0 0 4 0V4" />
        <path d="M16 4c2 2 2 5 0 7v8" />
      </svg>
    )
  }
  if (key.includes('guide')) {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c1.4-3 3.6-4.5 6.5-4.5s5.1 1.5 6.5 4.5" />
      </svg>
    )
  }
  if (key.includes('money') || key.includes('fx')) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5v9M9.4 9.4c.8-1 2.8-1.2 3.6.2.7 1.2-.1 2.2-1.8 2.5-1.8.3-2.7 1.3-2 2.5.8 1.3 2.8 1.2 3.7.1" />
      </svg>
    )
  }
  if (key.includes('now') || key.includes('around') || key.includes('live')) {
    return (
      <svg {...common}>
        <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <path d="m15.6 8.4-2.4 5.4-5.4 2.4 2.4-5.4Z" />
    </svg>
  )
}

function ServiceLink({
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
      className="group flex min-w-[128px] flex-1 flex-col items-center gap-2.5 px-2 py-2 text-center md:min-w-0"
    >
      <span className="flex h-12 w-12 items-center justify-center text-forest transition group-hover:text-emer">
        <ServiceGlyph id={`${id} ${label}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-graph">
          {label}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-sgraph">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

function HomeTopBar() {
  const { t } = useTranslation()
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
    <div className="mb-5 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-emer">{t('brand')}</p>
          <p className="font-display mt-0.5 text-[26px] font-medium text-graph">
            {t('brandTitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/around"
            className="inline-flex min-h-9 items-center rounded-full border border-bord bg-paper px-3 text-xs text-forest"
          >
            Moscow
          </Link>
          <Link
            to="/money"
            className="inline-flex min-h-9 items-center rounded-full bg-mist px-3 text-xs font-medium text-emer"
          >
            {sarRate ? `1 SAR ${sarRate}₽` : '₽ FX'}
          </Link>
        </div>
      </div>
      <p className="mt-2 text-[13px] text-sgraph">
        {time} in Moscow · a desk that answers in Arabic
      </p>
    </div>
  )
}

function HomeBody({ data }: { data: HomeFeed }) {
  const { t } = useTranslation()
  const services =
    data.services?.length > 0 ? data.services : FALLBACK_SERVICES

  return (
    <>
      <section className="mb-8 md:mb-12">
        <div className="relative">
          <div className="mb-7 hidden md:block">
            <p className="text-[13px] text-emer">Moscow, with someone who knows it</p>
            <h1 className="font-display mt-2 max-w-3xl text-[46px] leading-[1.08] font-medium text-graph lg:text-[56px]">
              {t('home.whereToday')}
            </h1>
            <div className="mt-4 max-w-[140px]">
              <div className="hairline" />
            </div>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-sgraph">
              {t('home.heroBody')}
            </p>
          </div>
          <AloBookingModule quickChips={data.quickChips} />
        </div>
      </section>

      <MoneyTodayStrip />

      <div className="-mx-4 mt-2 flex gap-1 overflow-x-auto border-y border-bord/70 px-2 py-3 scrollbar-none md:mx-0 md:flex-wrap md:justify-between md:overflow-visible md:px-0">
        {services.map((s) => (
          <ServiceLink
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
            title={t('home.hotels')}
            action={
              <Link to="/stays" className="text-sm text-emer">
                {t('seeAll')} {data.catalogStats?.hotels ?? ''}
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
                imageUrl={p.imageUrl}
                badge={typeof p.badge === 'string' ? p.badge : undefined}
              />
            ))}
          </CardRail>
        </>
      ) : null}

      {(data.featuredActivities?.length ?? 0) > 0 ? (
        <>
          <SectionHeader
            title={t('home.thingsToDo')}
            action={
              <Link to="/acts" className="text-sm text-emer">
                {t('seeAll')} {data.catalogStats?.activities ?? ''}
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
                imageUrl={p.imageUrl}
                badge={typeof p.badge === 'string' ? p.badge : undefined}
              />
            ))}
          </CardRail>
        </>
      ) : null}

      {(data.suitYou?.length ?? 0) > 0 ? (
        <>
          <SectionHeader title="What suits you today?" />
          <div className="grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
            {data.suitYou.map((m) => (
              <Link
                key={m.id}
                to="/explore"
                className="flex items-baseline justify-between gap-4 border-b border-bord/80 py-3.5"
              >
                <span>
                  <span className="font-display block text-[17px] font-medium text-graph">
                    {m.label}
                  </span>
                  {m.subtitle ? (
                    <span className="mt-0.5 block text-[12.5px] text-sgraph">
                      {m.subtitle}
                    </span>
                  ) : null}
                </span>
                <span className="text-champ" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <SectionHeader
        title={t('home.moscowNow')}
        action={
          <Link to="/around" className="text-sm text-emer">
            {t('seeAll')}
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

      <SectionHeader title={t('home.closeCentre')} />
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

      <SectionHeader title={t('home.firstTime')} />
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

      <SectionHeader title={t('home.whereEat')} />
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

      <SectionHeader title={t('home.withKids')} />
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
