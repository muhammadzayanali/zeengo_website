import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export type TripStop = {
  id?: string
  title: string
  subtitle?: string | null
  lat?: number | null
  lng?: number | null
}

export type TripDay = {
  dayNumber: number
  title: string
  mosqueKm?: number | null
  planDate?: string | null
  stops: TripStop[]
}

function yandexMapsUrl(stops: TripStop[]) {
  const pts = stops.filter((s) => s.lat != null && s.lng != null)
  if (pts.length === 0) {
    return 'https://yandex.com/maps/?text=Moscow'
  }
  const rtext = pts.map((s) => `${s.lat},${s.lng}`).join('~')
  return `https://yandex.com/maps/?rtext=${encodeURIComponent(rtext)}&rtt=pd`
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 20h16M6 20V10l6-4 6 4v10M10 20v-4h4v4M12 6V3" />
    </svg>
  )
}

function HeartButton() {
  return (
    <button
      type="button"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-bord bg-paper text-graph shadow-[var(--shadow-card)]"
      aria-label="Save trip"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 14c1.5-1.4 2.5-3.1 2.5-5A4.5 4.5 0 0 0 12 6.2 4.5 4.5 0 0 0 2.5 9c0 1.9 1 3.6 2.5 5l7 6.5z" />
      </svg>
    </button>
  )
}

function JourneyChip({
  icon,
  label,
}: {
  icon: ReactNode
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0EA] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em] text-forest uppercase">
      {icon}
      {label}
    </span>
  )
}

function JourneySummary({
  days,
  dayCount,
}: {
  days: TripDay[]
  dayCount: number
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <p className="text-[11px] font-bold tracking-[0.16em] text-sgraph uppercase">
          The journey
        </p>
        <span className="h-px flex-1 bg-bord" />
        <p className="text-[12px] font-semibold text-sgraph">{dayCount} days</p>
      </div>

      {/* Mobile: vertical timeline — nodes + continuous connector in one rail */}
      <ol className="md:hidden">
        {days.map((day, idx) => {
          const isLast = idx === days.length - 1
          return (
            <li
              key={day.dayNumber}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3.5"
            >
              <div className="relative flex flex-col items-center" aria-hidden>
                <span
                  className={`relative z-[1] mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-emer ring-[3px] ring-paper ${
                    idx === 0 ? 'bg-emer' : 'bg-paper'
                  }`}
                />
                {!isLast ? (
                  <span className="mt-1 w-[2px] min-h-[1.25rem] flex-1 rounded-full bg-emer/40" />
                ) : null}
              </div>
              <div className={isLast ? 'pb-1' : 'pb-6'}>
                <p className="text-[11px] font-bold tracking-[0.14em] text-emer uppercase">
                  Day {day.dayNumber}
                </p>
                <p className="mt-0.5 text-[17px] font-bold tracking-[-0.25px] text-graph">
                  {day.title}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <JourneyChip
                    icon={<PinIcon />}
                    label={`${day.stops.length} stops`}
                  />
                  {day.mosqueKm != null ? (
                    <JourneyChip
                      icon={<MosqueIcon />}
                      label={`Mosque ${day.mosqueKm} km`}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Desktop website: horizontal journey strip */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-4">
        {days.map((day, idx) => (
          <div
            key={day.dayNumber}
            className="relative rounded-[20px] border border-bord bg-paper p-5 shadow-[var(--shadow-card)]"
          >
            {idx < days.length - 1 ? (
              <span
                className="absolute top-8 -right-2 z-[1] hidden h-0.5 w-4 bg-emer/30 lg:block"
                aria-hidden
              />
            ) : null}
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full border-2 border-emer ${
                  idx === 0 ? 'bg-emer' : 'bg-paper'
                }`}
              />
              <p className="text-[11px] font-bold tracking-[0.14em] text-emer uppercase">
                Day {day.dayNumber}
              </p>
            </div>
            <p className="text-[17px] font-bold tracking-[-0.2px] text-graph">
              {day.title}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <JourneyChip
                icon={<PinIcon />}
                label={`${day.stops.length} stops`}
              />
              {day.mosqueKm != null ? (
                <JourneyChip
                  icon={<MosqueIcon />}
                  label={`Mosque ${day.mosqueKm} km`}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DayPlanCard({ day }: { day: TripDay }) {
  const mapsUrl = yandexMapsUrl(day.stops)

  return (
    <article className="overflow-hidden rounded-[22px] border border-bord bg-paper shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-[15px] font-bold text-white">
          {day.dayNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-graph">Day {day.dayNumber}</p>
          <p className="truncate text-[13px] text-sgraph">
            {day.title}
            {day.planDate ? ` · ${day.planDate}` : ''}
          </p>
        </div>
        {day.mosqueKm != null ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F0EA] px-2.5 py-1 text-[11px] font-bold text-forest">
            <MosqueIcon />
            {day.mosqueKm} km
          </span>
        ) : null}
      </div>

      <ol className="px-2 pb-1">
        {day.stops.map((stop, i) => {
          const to = stop.id
            ? `/places/${encodeURIComponent(stop.id)}`
            : `/search?q=${encodeURIComponent(stop.title)}`
          const isLast = i === day.stops.length - 1
          return (
            <li key={stop.id ?? `${day.dayNumber}-${i}`} className="relative">
              {!isLast ? (
                <span
                  className="absolute top-8 bottom-0 left-[27px] w-px bg-bord"
                  aria-hidden
                />
              ) : null}
              <Link
                to={to}
                className="group relative z-[1] flex items-center gap-3 rounded-[14px] px-2 py-2.5 transition hover:bg-mist/50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emer/40 bg-paper text-[11px] font-bold text-forest group-hover:bg-mint">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-graph">
                    {stop.title}
                  </span>
                  {stop.subtitle ? (
                    <span className="mt-0.5 block text-[12px] text-sgraph">
                      {stop.subtitle}
                    </span>
                  ) : null}
                </span>
                <svg
                  className="shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0B8B3"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="border-t border-bord px-4 py-3.5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 text-[13.5px] font-semibold text-graph"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m4 11 16-7-7 16-2.2-6.8z" />
          </svg>
          Open day {day.dayNumber} on Yandex Maps
        </a>
      </div>
    </article>
  )
}

/**
 * Client prototype My Trip plan UI.
 * Mobile = journey timeline + stacked day cards.
 * Desktop = journey strip + multi-column day cards.
 */
export function TripPlanView({
  title,
  subtitle,
  days,
  showHeart = true,
  showJourney = true,
  topBar,
  headerExtra,
  footer,
}: {
  title: string
  subtitle?: string | null
  days: TripDay[]
  showHeart?: boolean
  showJourney?: boolean
  topBar?: ReactNode
  headerExtra?: ReactNode
  footer?: ReactNode
}) {
  const dayCount = days.length

  return (
    <div className="pb-2">
      {topBar ? <div className="mb-4">{topBar}</div> : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Mobile: centered title like prototype */}
          <div className="relative md:hidden">
            <h1
              className={`text-[28px] leading-[1.1] font-bold tracking-[-0.45px] text-graph ${
                showHeart ? 'pr-12 text-center' : 'text-left'
              }`}
            >
              {title}
            </h1>
            {showHeart ? (
              <div className="absolute top-0 right-0">
                <HeartButton />
              </div>
            ) : null}
          </div>
          {/* Desktop website title */}
          <div className="hidden md:block">
            <h1 className="text-[40px] leading-[1.08] font-bold tracking-[-0.55px] text-graph">
              {title}
            </h1>
          </div>
          {subtitle ? (
            <p
              className={`mt-2 max-w-xl text-[14px] leading-relaxed text-sgraph md:text-left md:text-[15px] ${
                showHeart ? 'text-center md:text-left' : 'text-left'
              }`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {showHeart ? (
          <div className="hidden md:block">
            <HeartButton />
          </div>
        ) : null}
      </div>

      {headerExtra ? <div className="mt-5">{headerExtra}</div> : null}

      {days.length === 0 ? null : (
        <>
          {showJourney ? (
            <div className="mt-7 md:mt-9">
              <JourneySummary days={days} dayCount={dayCount} />
            </div>
          ) : null}

          <div
            className={`space-y-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0 lg:grid-cols-3 ${
              showJourney ? 'mt-6 md:mt-8' : 'mt-6'
            }`}
          >
            {days.map((day) => (
              <DayPlanCard key={day.dayNumber} day={day} />
            ))}
          </div>
        </>
      )}

      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  )
}
