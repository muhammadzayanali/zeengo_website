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
          ? 'group flex w-full min-w-0 flex-col'
          : 'group flex min-w-[168px] max-w-[210px] shrink-0 flex-col md:max-w-none md:min-w-0'
      }
    >
      {showImg ? (
        <div
          className={
            isGrid
              ? 'relative aspect-[4/5] overflow-hidden rounded-[12px] bg-[#d8d0c2] sm:aspect-[5/6]'
              : 'relative aspect-[4/5] overflow-hidden rounded-[12px] bg-[#d8d0c2]'
          }
        >
          <img
            src={imageUrl!}
            alt=""
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
          {badge ? (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ivory/92 px-2.5 py-1 text-[11px] text-forest backdrop-blur-sm">
              {badge}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative flex min-h-[92px] items-end rounded-[4px] border-b border-champ/50 pb-2">
          {badge ? (
            <span className="absolute top-0 right-0 text-[11px] text-champ">{badge}</span>
          ) : null}
        </div>
      )}
      <div className="pt-2.5">
        <p className="font-display line-clamp-2 text-[16px] leading-snug font-medium text-graph group-hover:text-emer">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-sgraph">
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

export function CardRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-8 md:overflow-visible md:px-0 lg:grid-cols-4">
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
      className={`flex min-h-[108px] flex-col items-start justify-end gap-1 rounded-[12px] px-4 py-4 transition ${
        dark
          ? 'bg-forest text-mint'
          : 'border border-bord/80 bg-paper text-graph'
      }`}
    >
      <span className="font-display text-[18px] font-medium tracking-[-0.2px]">
        {title}
      </span>
      {subtitle ? (
        <span
          className={`text-[12.5px] leading-snug ${
            dark ? 'text-white/70' : 'text-sgraph'
          }`}
        >
          {subtitle}
        </span>
      ) : null}
    </Link>
  )
}
