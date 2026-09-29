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
    <div className="mb-3 flex items-end justify-between gap-3 pt-6 md:pt-8">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[10.5px] font-semibold tracking-[0.12em] text-emer uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[21px] font-bold tracking-[-0.35px] text-graph md:text-2xl">
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[11px] border px-3 py-2 text-[11px] font-semibold tracking-[0.04em] uppercase transition ${
        active
          ? 'border-[#cfe3d9] bg-mint text-forest'
          : 'border-bord bg-mist text-sgraph'
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
      className={`inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-emer px-5 text-[15.5px] font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)] transition hover:bg-[#1b5f46] active:scale-[0.98] disabled:opacity-50 md:w-auto md:px-8 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="rounded-[20px] border border-bord bg-paper p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-3 h-2 max-w-xs animate-pulse rounded bg-mist" />
      <p className="text-sm text-sgraph">{label}</p>
    </div>
  )
}

export function EmptyBlock({
  title,
  body,
}: {
  title: string
  body?: string
}) {
  return (
    <div className="rounded-[20px] border border-bord bg-paper p-8 text-center shadow-[var(--shadow-card)]">
      <p className="text-[17px] font-semibold text-graph">{title}</p>
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
    <div className="rounded-[20px] border border-[#F0CFCA] bg-[#FBEAE8] p-6 text-center">
      <p className="text-sm font-semibold text-[#C0392B]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-bold text-forest underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
