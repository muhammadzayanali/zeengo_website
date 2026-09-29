import { useState } from 'react'
import { Link } from 'react-router-dom'

type PlaceCardProps = {
  to: string
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  badge?: string | null
  layout?: 'rail' | 'grid'
}

export function PlaceCard({
  to,
  title,
  subtitle,
  imageUrl,
  badge,
  layout = 'rail',
}: PlaceCardProps) {
  const [broken, setBroken] = useState(false)
  const showImg = Boolean(imageUrl) && !broken
  const isGrid = layout === 'grid'

  return (
    <Link
      to={to}
      className={
        isGrid
          ? 'group flex w-full min-w-0 flex-col overflow-hidden rounded-[18px] border border-bord bg-paper shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-lift)]'
          : 'group flex min-w-[172px] max-w-[220px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-bord bg-paper shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-lift)] md:max-w-none md:min-w-0'
      }
    >
      <div
        className={
          isGrid
            ? 'relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-mist via-[#e8f3ed] to-mint sm:aspect-[16/11]'
            : 'relative h-[116px] overflow-hidden bg-gradient-to-br from-mist via-[#e8f3ed] to-mint md:h-40'
        }
      >
        {showImg ? (
          <img
            src={imageUrl!}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-end p-3">
            <span className="text-[11px] font-semibold tracking-wide text-forest/55 uppercase">
              aLo
            </span>
          </div>
        )}
        {badge ? (
          <span className="absolute top-2 right-2 rounded-2xl bg-mint px-2 py-1 text-[10px] font-extrabold text-forest">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-graph group-hover:text-emer">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-sgraph">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  )
}

export function CardRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
      {children}
    </div>
  )
}

export function ServiceTile({
  to,
  title,
  subtitle,
  dark,
}: {
  to: string
  title: string
  subtitle?: string
  dark?: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-[122px] flex-col items-start gap-3 rounded-[18px] border border-bord p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-lift)] active:scale-[0.98] ${
        dark ? 'bg-forest text-mint' : 'bg-paper text-graph'
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-[13px] ${
          dark ? 'bg-white/10' : 'bg-mint'
        }`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={dark ? '#DDEDE5' : '#1F6B4F'}
          strokeWidth="1.9"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
      <span>
        <span className="block text-[14.5px] font-semibold tracking-[-0.15px]">
          {title}
        </span>
        {subtitle ? (
          <span
            className={`mt-0.5 block text-[11.5px] leading-snug ${
              dark ? 'text-white/70' : 'text-sgraph'
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
