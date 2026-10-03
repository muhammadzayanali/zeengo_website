import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clientV2Api, type HomeFeed } from '@/shared/api/clientV2'
import { catalogApi, type ListingCard } from '@/shared/api/catalog'
import { fetchCbrFx, rubPerUnit } from '@/shared/api/cbrFx'
import {
  ErrorBlock,
  LoadingBlock,
  SectionHeader,
} from '@/components/ui/Primitives'
import { CardRail, PlaceCard } from '@/components/cards/Cards'
import { AloBookingModule } from '@/components/home/AloBookingModule'
import { DESK_PHOTOS, HERO_MOSCOW, resolvePlacePhoto } from '@/theme/placePhotos'

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

function DeskMoneyLine() {
  const fxQ = useQuery({
    queryKey: ['cbr-fx'],
    queryFn: fetchCbrFx,
    staleTime: 30 * 60_000,
    retry: 1,
  })
  const rates = fxQ.data?.rates
  const fmt = (code: 'SAR' | 'AED' | 'USD') => {
    const row = rates?.[code]
    if (!row) return null
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rubPerUnit(row))
  }
  const sar = fmt('SAR')
  const aed = fmt('AED')
  const usd = fmt('USD')

  if (!sar && !aed && !usd) return null

  return (
    <div className="mt-12 flex flex-wrap items-end justify-between gap-4 border-y border-bord/80 py-6">
      <div>
        <p className="text-[12px] tracking-[0.14em] text-champ uppercase">
          The rouble today
        </p>
        <p className="mt-2 font-display text-[22px] text-graph md:text-[26px]">
          {sar ? `1 SAR ${sar} ₽` : 'Live CBR rates'}
          {aed ? ` · 1 AED ${aed} ₽` : ''}
        </p>
        {usd ? (
          <p className="mt-1 text-[13px] text-sgraph">1 USD {usd} ₽ · CBR</p>
        ) : null}
      </div>
      <Link
        to="/money"
        className="text-sm text-forest underline-offset-4 hover:underline"
      >
        Converter
      </Link>
    </div>
  )
}

function HomeBody({
  data,
  catalogHotels,
  catalogActs,
}: {
  data: HomeFeed
  catalogHotels: ListingCard[]
  catalogActs: ListingCard[]
}) {
  const { t } = useTranslation()
  const time = useMemo(() => moscowClock(), [])
  const hotels = catalogHotels.slice(0, 5)
  const featuredStay = hotels[0]
  const moreStays = hotels.slice(1)
  const acts =
    catalogActs.length > 0
      ? catalogActs.slice(0, 4).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: p.area || p.city || p.subtitle,
          imageUrl: p.imageUrl || p.images[0] || null,
          to: `/experiences/${encodeURIComponent(p.id)}`,
        }))
      : (data.featuredActivities ?? []).slice(0, 4).map((p) => ({
          id: String(p.id),
          title: p.title,
          subtitle: p.area || p.subtitle,
          imageUrl: p.imageUrl,
          to: `/places/${encodeURIComponent(String(p.id))}`,
        }))
  const now = (data.moscowNow ?? []).slice(0, 4)
  const centre = (data.closeToCentre ?? []).slice(0, 3)
  const first = (data.firstTime ?? []).slice(0, 3)
  const food = (data.food ?? []).slice(0, 3)
  const kids = (data.withKids ?? []).slice(0, 3)

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden md:min-h-[92vh]">
        <img
          src={HERO_MOSCOW}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_32%]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#12372A]/50 via-[#12372A]/20 to-[#12372A]/88"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-28 pt-24 md:min-h-[92vh] md:px-6 md:pb-36">
          <p className="text-[12px] tracking-[0.16em] text-[#C7A96B] uppercase">
            {time} in Moscow · someone who knows it
          </p>
          <h1 className="font-display mt-3 max-w-[16ch] text-[42px] leading-[1.04] font-medium text-[#F3EEE4] md:text-[62px] lg:text-[72px]">
            {t('home.whereToday')}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#F3EEE4]/84 md:text-[17px]">
            {t('home.heroBody')}
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
        <div className="-mt-16 bg-paper/96 p-3 shadow-[0_22px_60px_rgba(18,55,42,0.18)] ring-1 ring-[#12372A]/8 md:-mt-20 md:p-5">
          <AloBookingModule tone="desk" quickChips={data.quickChips} />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-4 md:gap-5">
          {[
            {
              to: '/hotels',
              title: 'Stay the night',
              body: 'Rooms the desk already knows',
              img: DESK_PHOTOS.stay,
            },
            {
              to: '/transport',
              title: 'A car waiting',
              body: 'Airport, hourly, or the day',
              img: DESK_PHOTOS.car,
            },
            {
              to: '/guides',
              title: 'Arabic at the table',
              body: 'Someone who can speak for you',
              img: DESK_PHOTOS.guide,
            },
            {
              to: '/money',
              title: 'The rouble today',
              body: 'Honest rates, no speech',
              img: DESK_PHOTOS.money,
            },
          ].map((d) => (
            <Link key={d.to} to={d.to} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#cfc6b6] md:aspect-[3/4]">
                <img
                  src={d.img}
                  alt=""
                  className="h-full w-full object-cover transition duration-[400ms] ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#12372A]/82 via-[#12372A]/15 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <span className="font-display block text-[17px] text-[#F3EEE4] md:text-[21px]">
                    {d.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-[#F3EEE4]/75">
                    {d.body}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <DeskMoneyLine />

        {featuredStay ? (
          <section className="mt-4 grid items-stretch gap-6 md:mt-8 md:grid-cols-12 md:gap-12">
            <Link
              to={`/hotels/${encodeURIComponent(featuredStay.id)}`}
              className="group relative min-h-[300px] overflow-hidden bg-[#cfc6b6] md:col-span-7 md:min-h-[460px]"
            >
              <img
                src={resolvePlacePhoto(
                  featuredStay.title,
                  featuredStay.id,
                  featuredStay.imageUrl || featuredStay.images[0],
                )}
                alt=""
                className="h-full w-full object-cover transition duration-[400ms] ease-out group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#12372A]/50 to-transparent" />
            </Link>
            <div className="flex flex-col justify-end md:col-span-5 md:py-6">
              <p className="text-[12px] tracking-[0.14em] text-champ uppercase">
                A room we would book
              </p>
              <h2 className="font-display mt-2 text-[28px] leading-tight font-medium text-graph md:text-[36px]">
                {featuredStay.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-sgraph">
                {featuredStay.summary ||
                  featuredStay.area ||
                  featuredStay.subtitle ||
                  'Ask the desk for the room, the dates, and who it is for.'}
              </p>
              <Link
                to={`/hotels/${encodeURIComponent(featuredStay.id)}`}
                className="mt-7 inline-flex w-fit items-center gap-2 border-b border-champ pb-0.5 text-sm text-forest"
              >
                Look at this stay
              </Link>
              <Link
                to="/hotels"
                className="mt-3 text-sm text-sgraph hover:text-emer"
              >
                {t('seeAll')} {data.catalogStats?.hotels ?? ''} stays
              </Link>
            </div>
          </section>
        ) : null}

        {moreStays.length > 0 ? (
          <>
            <SectionHeader
              title={t('home.hotels')}
              eyebrow="From the catalog"
              action={
                <Link to="/hotels" className="text-sm text-emer">
                  {t('seeAll')}
                </Link>
              }
            />
            <CardRail>
              {moreStays.map((p) => (
                <PlaceCard
                  key={p.id}
                  to={`/hotels/${encodeURIComponent(p.id)}`}
                  title={p.title}
                  subtitle={p.area || p.city || p.subtitle}
                  imageUrl={p.imageUrl || p.images[0]}
                />
              ))}
            </CardRail>
          </>
        ) : null}

        {acts.length > 0 ? (
          <>
            <SectionHeader
              title={t('home.thingsToDo')}
              eyebrow="Days that fill themselves"
              action={
                <Link to="/experiences" className="text-sm text-emer">
                  {t('seeAll')} {data.catalogStats?.activities ?? ''}
                </Link>
              }
            />
            <CardRail>
              {acts.map((p) => (
                <PlaceCard
                  key={p.id}
                  to={p.to}
                  title={p.title}
                  subtitle={p.subtitle}
                  imageUrl={p.imageUrl}
                />
              ))}
            </CardRail>
          </>
        ) : null}

        {(data.suitYou?.length ?? 0) > 0 ? (
          <section className="mt-12 border-y border-bord/80 py-10 md:py-14">
            <p className="text-[12px] tracking-[0.14em] text-champ uppercase">
              If you are not sure
            </p>
            <h2 className="font-display mt-2 text-[28px] font-medium text-graph md:text-[32px]">
              What suits you today?
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-1 sm:grid-cols-2">
              {data.suitYou.map((m) => (
                <Link
                  key={m.id}
                  to="/explore"
                  className="flex items-baseline justify-between gap-4 border-b border-bord/80 py-4"
                >
                  <span>
                    <span className="font-display block text-[18px] font-medium text-graph">
                      {m.label}
                    </span>
                    {m.subtitle ? (
                      <span className="mt-0.5 block text-[13px] text-sgraph">
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
          </section>
        ) : null}

        {now.length > 0 ? (
          <>
            <SectionHeader
              title={t('home.moscowNow')}
              action={
                <Link to="/around" className="text-sm text-emer">
                  {t('seeAll')}
                </Link>
              }
            />
            <CardRail>
              {now.map((p) => (
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
          </>
        ) : null}

        {centre.length > 0 ? (
          <>
            <SectionHeader title={t('home.closeCentre')} />
            <CardRail>
              {centre.map((p) => (
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
        ) : null}

        {first.length > 0 ? (
          <section className="mt-12 border-y border-bord/80 py-10 md:py-14">
            <p className="text-[12px] tracking-[0.14em] text-champ uppercase">
              If this is the first visit
            </p>
            <h2 className="font-display mt-2 max-w-xl text-[28px] font-medium text-graph md:text-[32px]">
              {t('home.firstTime')}
            </h2>
            <div className="mt-7 grid gap-8 md:grid-cols-3">
              {first.map((p) => (
                <PlaceCard
                  key={String(p.id)}
                  layout="grid"
                  to={`/places/${encodeURIComponent(String(p.id))}`}
                  title={p.title}
                  subtitle={p.area || p.subtitle}
                  imageUrl={p.imageUrl}
                />
              ))}
            </div>
          </section>
        ) : null}

        {food.length > 0 ? (
          <>
            <SectionHeader title={t('home.whereEat')} />
            <CardRail>
              {food.map((p) => (
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
          </>
        ) : null}

        {kids.length > 0 ? (
          <>
            <SectionHeader title={t('home.withKids')} />
            <CardRail>
              {kids.map((p) => (
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
        ) : null}
      </div>

      <section className="mt-16 bg-forest text-[#F3EEE4]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 md:flex-row md:items-end md:justify-between md:px-6 md:py-20">
          <div className="max-w-xl">
            <p className="text-[12px] tracking-[0.14em] text-[#C7A96B] uppercase">
              The desk
            </p>
            <h2 className="font-display mt-3 text-[32px] leading-tight font-medium md:text-[40px]">
              Tell us who is coming, and when.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#F3EEE4]/75">
              A stay, a driver, a table that understands Arabic — arranged the
              way a local desk would, not a booking engine.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/trip"
              className="inline-flex min-h-12 items-center bg-[#F3EEE4] px-5 text-sm font-medium text-forest"
            >
              Ask the desk
            </Link>
            <Link
              to="/search"
              className="inline-flex min-h-12 items-center border border-[#F3EEE4]/35 px-5 text-sm text-[#F3EEE4]"
            >
              Search Moscow
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export function HomePage() {
  const q = useQuery({
    queryKey: ['client-v2', 'home'],
    queryFn: () => clientV2Api.home(),
  })
  const hotelsQ = useQuery({
    queryKey: ['catalog', 'hotels', 'home-rail'],
    queryFn: () =>
      catalogApi.list('hotels', {
        city: 'Moscow',
        limit: 5,
        sort: 'recommended',
        withPhotos: true,
      }),
  })
  const actsQ = useQuery({
    queryKey: ['catalog', 'activities', 'home-rail'],
    queryFn: () =>
      catalogApi.list('activities', {
        city: 'Moscow',
        limit: 4,
        sort: 'recommended',
        withPhotos: true,
      }),
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
    <HomeBody
      data={q.data}
      catalogHotels={hotelsQ.data?.data ?? []}
      catalogActs={actsQ.data?.data ?? []}
    />
  )
}
