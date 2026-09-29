/** Zeengo bird mark — forest tile with gold Z-bird (product logo). */
export const BRAND_MARK_SRC = '/brand-mark.png'

export function BrandMark({
  size = 36,
  className = '',
  rounded = 'xl',
}: {
  size?: number
  className?: string
  rounded?: 'full' | 'xl' | 'lg' | 'md'
}) {
  const radius =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'lg'
        ? 'rounded-[14px]'
        : rounded === 'md'
          ? 'rounded-[11px]'
          : 'rounded-[12px]'

  return (
    <img
      src={BRAND_MARK_SRC}
      alt="ZEEN"
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 object-cover shadow-[0_2px_10px_rgba(18,55,42,0.18)] ${radius} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
