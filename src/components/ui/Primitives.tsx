import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function SectionHeader({
  title,
  action,
  eyebrow,
}: {
  title: string
  action?: ReactNode
  eyebrow?: string
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 pt-8 md:pt-10">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[12px] text-champ">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-[24px] leading-tight font-medium text-graph md:text-[28px]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
        active
          ? 'border-forest bg-forest text-ivory'
          : 'border-bord bg-paper text-sgraph hover:border-champ/60 hover:text-graph'
      }`}
    >
      {children}
    </button>
  )
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {children}
    </div>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-emer px-6 text-[15px] font-medium text-white transition hover:bg-forest active:scale-[0.99] disabled:opacity-50 md:w-auto md:px-8 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export { LoadingBlock, InlineLoader, ZeenLoader } from './ZeenLoader'

export function EmptyBlock({
  title,
  body,
}: {
  title: string
  body?: string
}) {
  return (
    <div className="border-y border-bord bg-paper/70 px-2 py-10 text-center">
      <p className="font-display text-[20px] font-medium text-graph">{title}</p>
      {body ? <p className="mt-2 text-sm text-sgraph">{body}</p> : null}
    </div>
  )
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="border-y border-[#E8C8C2] bg-[#FBEAE8]/70 px-2 py-8 text-center">
      <p className="text-sm font-medium text-[#C0392B]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-forest underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
