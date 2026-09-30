import { BrandMark } from './BrandMark'

/**
 * Product loader for aLo · ZEEN — brand mark + soft orbit. No caption text.
 */
export function ZeenLoader({
  size = 'md',
  label,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  /** Accessible name only — never shown visually. */
  label?: string
  className?: string
}) {
  const dim =
    size === 'sm' ? 'h-11 w-11' : size === 'lg' ? 'h-[5.25rem] w-[5.25rem]' : 'h-16 w-16'
  const ring =
    size === 'sm' ? 'border-[2.5px]' : size === 'lg' ? 'border-[3px]' : 'border-[2.5px]'
  const markPx = size === 'sm' ? 26 : size === 'lg' ? 44 : 34
  const a11y = label || 'Loading'

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={a11y}
    >
      <div className={`relative ${dim}`}>
        <span
          className="absolute inset-[10%] rounded-full bg-mint/70 animate-zeen-breathe"
          aria-hidden
        />
        <span
          className={`absolute inset-0 rounded-full border-transparent border-t-emer border-r-fresh/75 ${ring} animate-zeen-spin`}
          aria-hidden
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <BrandMark size={markPx} rounded="lg" className="relative z-[1]" />
        </span>
      </div>
      <span className="sr-only">{a11y}</span>
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
    <div className="flex items-center justify-center py-4">
      <ZeenLoader size="sm" label={label} />
    </div>
  )
}
