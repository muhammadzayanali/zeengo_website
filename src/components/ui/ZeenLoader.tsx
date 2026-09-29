import { BrandMark } from './BrandMark'

/**
 * Product loader for aLo · ZEEN — brand mark + soft orbit (no text "ZN").
 */
export function ZeenLoader({
  size = 'md',
  label,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  /** Optional caption under the mark (kept quiet for polish). */
  label?: string
  className?: string
}) {
  const dim =
    size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-[4.5rem] w-[4.5rem]' : 'h-14 w-14'
  const ring =
    size === 'sm' ? 'border-[2.5px]' : size === 'lg' ? 'border-[3.5px]' : 'border-[3px]'
  const markPx = size === 'sm' ? 28 : size === 'lg' ? 48 : 36

  return (
    <div
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label || 'Loading'}
    >
      <div className={`relative ${dim}`}>
        <span
          className="absolute inset-0 rounded-[14px] bg-mint/80 animate-zeen-breathe"
          aria-hidden
        />
        <span
          className={`absolute inset-0 rounded-[14px] border-transparent border-t-emer border-r-fresh/70 ${ring} animate-zeen-spin`}
          aria-hidden
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <BrandMark size={markPx} rounded="lg" className="relative z-[1]" />
        </span>
      </div>
      {label ? (
        <p className="max-w-[16rem] text-center text-[12.5px] font-medium tracking-wide text-sgraph">
          {label}
        </p>
      ) : null}
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  )
}

/** Full-width section / page loading surface. */
export function LoadingBlock({
  label,
  fill = false,
}: {
  label?: string
  /** Stretch to feel like a route-level wait. */
  fill?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[20px] border border-bord/80 bg-paper/90 px-6 py-12 text-center shadow-[var(--shadow-card)] backdrop-blur-[2px] animate-page-enter ${
        fill ? 'min-h-[42vh]' : 'min-h-[180px]'
      }`}
    >
      <ZeenLoader size="lg" label={label} />
    </div>
  )
}

/** Compact inline wait (lists, strips, panels). */
export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <ZeenLoader size="sm" label={label} />
    </div>
  )
}
