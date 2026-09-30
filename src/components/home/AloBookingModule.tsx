import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clientV2Api } from '@/shared/api/clientV2'
import { InlineLoader } from '@/components/ui/Primitives'

type Mode = 'move' | 'stay' | 'do'
type Picker = 'from' | 'to' | 'date' | 'people' | null

const QUICK_DEFAULT = [
  'Halal food near me',
  'Red Square',
  'Car with driver',
  'What can I do today?',
  'Train to St Petersburg',
]

const CATEGORIES = [
  { id: 'stays', label: 'Stays', to: '/stays', icon: 'bed' },
  { id: 'car', label: 'Car', to: '/cars', icon: 'car' },
  { id: 'places', label: 'Places', to: '/around', icon: 'pin' },
  { id: 'food', label: 'Food', to: '/food', icon: 'food' },
  { id: 'tours', label: 'Tours', to: '/acts', icon: 'ticket' },
] as const

const FROM_OPTIONS: Array<{
  id: string
  label: string
  hint: string
  group: 'now' | 'landmark' | 'airport' | 'stay'
  icon: string
}> = [
  {
    id: 'gps',
    label: 'Your location in Moscow',
    hint: 'Use where you are now',
    group: 'now',
    icon: 'nav',
  },
  {
    id: 'red-square',
    label: 'Red Square',
    hint: 'City centre landmark',
    group: 'landmark',
    icon: 'pin',
  },
  {
    id: 'svo',
    label: 'Sheremetyevo Airport',
    hint: 'SVO · north of Moscow',
    group: 'airport',
    icon: 'pin',
  },
  {
    id: 'dme',
    label: 'Domodedovo Airport',
    hint: 'DME · south of Moscow',
    group: 'airport',
    icon: 'pin',
  },
  {
    id: 'vko',
    label: 'Vnukovo Airport',
    hint: 'VKO · southwest',
    group: 'airport',
    icon: 'pin',
  },
  {
    id: 'hotel',
    label: 'Hotel / stay address',
    hint: 'Pickup from your stay',
    group: 'stay',
    icon: 'bed',
  },
]

type DatePresetId = 'today' | 'tomorrow' | 'week' | 'custom'

const DATE_OPTIONS: Array<{
  id: DatePresetId
  label: string
  hint: string
}> = [
  { id: 'today', label: 'Today', hint: 'Ready for today' },
  { id: 'tomorrow', label: 'Tomorrow', hint: 'Plan for tomorrow' },
  { id: 'week', label: 'This week', hint: 'Next 7 days' },
  { id: 'custom', label: 'Custom', hint: 'Pick from–to dates' },
]

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function resolveDateSelection(
  preset: DatePresetId,
  customFrom: string,
  customTo: string,
): { label: string; from: string; to: string } {
  const today = toIsoDate(new Date())
  if (preset === 'today') {
    return { label: 'Today', from: today, to: today }
  }
  if (preset === 'tomorrow') {
    const t = addDays(today, 1)
    return { label: 'Tomorrow', from: t, to: t }
  }
  if (preset === 'week') {
    const end = addDays(today, 6)
    return { label: 'This week', from: today, to: end }
  }
  const from = customFrom || today
  const to = customTo && customTo >= from ? customTo : from
  const label =
    from === to
      ? formatShortDate(from)
      : `${formatShortDate(from)} – ${formatShortDate(to)}`
  return { label, from, to }
}

/** Compact month grid — first tap = from, second tap = to. */
function DateRangeCalendar({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (next: { from: string; to: string }) => void
}) {
  const todayIso = toIsoDate(new Date())
  const anchor = parseIsoDate(from || todayIso)
  const [cursor, setCursor] = useState(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), 1),
  )
  const [picking, setPicking] = useState<'from' | 'to'>('from')

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const onDay = (day: number) => {
    const iso = toIsoDate(new Date(year, month, day))
    if (iso < todayIso) return
    if (picking === 'from' || iso < from) {
      onChange({ from: iso, to: iso })
      setPicking('to')
      return
    }
    onChange({ from, to: iso })
    setPicking('from')
  }

  return (
    <div className="mx-1 mt-2 rounded-[18px] border border-bord bg-mist/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-bord bg-paper text-forest"
          aria-label="Previous month"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
        >
          ‹
        </button>
        <p className="text-[13px] font-bold text-graph">{monthLabel}</p>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-bord bg-paper text-forest"
          aria-label="Next month"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold tracking-wide text-sgraph uppercase">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />
          const iso = toIsoDate(new Date(year, month, day))
          const disabled = iso < todayIso
          const inRange = from && to && iso >= from && iso <= to
          const isStart = iso === from
          const isEnd = iso === to
          const edge = isStart || isEnd
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onDay(day)}
              className={`flex h-9 items-center justify-center rounded-full text-[12.5px] font-semibold transition disabled:opacity-30 ${
                edge
                  ? 'bg-emer text-white shadow-[0_3px_10px_rgba(31,107,79,0.28)]'
                  : inRange
                    ? 'bg-mint text-forest'
                    : 'text-graph hover:bg-paper'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-sgraph">
        {from && to
          ? from === to
            ? `Selected · ${formatShortDate(from)}`
            : `${formatShortDate(from)} → ${formatShortDate(to)}`
          : picking === 'from'
            ? 'Tap a start date'
            : 'Tap an end date'}
      </p>
    </div>
  )
}

const GROUP_LABEL: Record<(typeof FROM_OPTIONS)[number]['group'], string> = {
  now: 'Current',
  landmark: 'Landmarks',
  airport: 'Airports',
  stay: 'Stay',
}

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string
  className?: string
}) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (name) {
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16.2 16.2 3.3 3.3" />
        </svg>
      )
    case 'headset':
      return (
        <svg {...props}>
          <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
          <path d="M4 13v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zM18 13v5h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1z" />
        </svg>
      )
    case 'bed':
      return (
        <svg {...props}>
          <path d="M3 18V9h2.5a3.5 3.5 0 0 1 3.5 3.5V18" />
          <path d="M9 18V12.5A3.5 3.5 0 0 1 12.5 9H21v9" />
          <path d="M3 18h18" />
        </svg>
      )
    case 'car':
      return (
        <svg {...props}>
          <path d="M5 15.5 6.2 10a2 2 0 0 1 2-1.5h7.6a2 2 0 0 1 2 1.5l1.2 5.5" />
          <path d="M5 15.5h14v2.2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
          <circle cx="7.5" cy="17.8" r="1.1" />
          <circle cx="16.5" cy="17.8" r="1.1" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...props}>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      )
    case 'food':
      return (
        <svg {...props}>
          <path d="M8 3v8M8 11v10M6 3c0 3 2 4 2 8M10 3c0 3-2 4-2 8" />
          <path d="M16 3v7a2 2 0 0 0 2 2v9" />
        </svg>
      )
    case 'ticket':
      return (
        <svg {...props}>
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
          <path d="M12 7v10" strokeDasharray="2 3" />
        </svg>
      )
    case 'nav':
      return (
        <svg {...props}>
          <path d="m4 11 16-7-7 16-2.2-6.8z" />
        </svg>
      )
    case 'cal':
      return (
        <svg {...props}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      )
    case 'people':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="2.4" />
          <circle cx="16" cy="9" r="2" />
          <path d="M4.5 18c1.2-2.6 2.9-3.8 4.5-3.8S12.3 15.4 13.5 18" />
          <path d="M13 18c.7-1.6 1.8-2.4 3-2.4s2.2.8 2.8 2.4" />
        </svg>
      )
    case 'chev':
      return (
        <svg {...props} className={`${className} text-[#B0B8B3]`}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      )
    case 'x':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    default:
      return null
  }
}

function ModeTabs({
  mode,
  setMode,
}: {
  mode: Mode
  setMode: (m: Mode) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-[16px] bg-mist/80 p-1.5 md:inline-grid md:w-auto md:min-w-[320px]">
      {(
        [
          ['move', 'Move', 'car'],
          ['stay', 'Stay', 'bed'],
          ['do', 'Do', 'ticket'],
        ] as const
      ).map(([id, label, icon]) => {
        const on = mode === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-[12px] px-3 text-[13.5px] font-semibold transition ${
              on
                ? 'bg-paper text-graph shadow-[var(--shadow-card)]'
                : 'text-sgraph hover:text-graph'
            }`}
          >
            <span className={on ? 'text-emer' : 'text-sgraph'}>
              <Icon name={icon} className="h-4 w-4" />
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function Field({
  label,
  icon,
  value,
  muted,
  onClick,
  onClose,
  desktop,
  active,
  panel,
}: {
  label: string
  icon: string
  value: string
  muted?: boolean
  onClick?: () => void
  onClose?: () => void
  desktop?: boolean
  active?: boolean
  /** Floated via portal — never expands the booking bar height/width. */
  panel?: React.ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  const placePanel = () => {
    const el = wrapRef.current
    if (!el || el.getClientRects().length === 0) {
      setBox(null)
      return
    }
    const r = el.getBoundingClientRect()
    const width = Math.min(380, Math.max(280, window.innerWidth - 24))
    let left = r.left
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12)
    }
    // Keep panel in viewport vertically when near the bottom.
    const maxH = Math.min(window.innerHeight * 0.62, 420)
    let top = r.bottom + 6
    if (top + 200 > window.innerHeight) {
      top = Math.max(12, r.top - 6 - Math.min(maxH, 320))
    }
    setBox({ top, left, width })
  }

  useEffect(() => {
    if (!active || !panel) {
      setBox(null)
      return
    }
    placePanel()
    const onWin = () => placePanel()
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [active, panel])

  useEffect(() => {
    if (!active || !panel || !box) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Node)) return
      if (wrapRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      onClose?.()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    // `click` (not mousedown) so option onClick can commit first.
    document.addEventListener('click', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, panel, box, onClose])

  const Comp = onClick ? 'button' : 'div'
  const fieldBtn = desktop ? (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative flex min-w-0 w-full flex-1 items-start gap-3 px-4 py-3.5 text-left transition ${
        active ? 'bg-mint/55' : 'hover:bg-mist/60'
      }`}
    >
      {active ? (
        <span
          className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-emer"
          aria-hidden
        />
      ) : null}
      <span
        className={`mt-0.5 ${active ? 'text-emer' : 'text-sgraph group-hover:text-emer'}`}
      >
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span
          className={`block text-[10px] font-semibold tracking-[0.14em] uppercase ${
            active ? 'text-emer' : 'text-sgraph'
          }`}
        >
          {label}
        </span>
        <span
          className={`mt-1 block truncate text-[15px] font-semibold ${
            muted ? 'font-medium text-sgraph' : 'text-graph'
          }`}
        >
          {value}
        </span>
      </span>
    </Comp>
  ) : (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-3.5 text-left transition ${
        active ? 'bg-mint/45' : ''
      }`}
    >
      <span className={active ? 'text-emer' : 'text-sgraph'}>
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[10px] font-semibold tracking-[0.12em] uppercase ${
            active ? 'text-emer' : 'text-sgraph'
          }`}
        >
          {label}
        </span>
        <span
          className={`mt-0.5 block truncate text-[15px] font-semibold ${
            muted ? 'font-medium text-sgraph' : 'text-graph'
          }`}
        >
          {value}
        </span>
      </span>
      <Icon name="chev" className="h-4 w-4" />
    </Comp>
  )

  const portal =
    active && panel && box && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={{
              position: 'fixed',
              top: box.top,
              left: box.left,
              width: box.width,
              zIndex: 80,
            }}
            className="overflow-hidden rounded-[20px] border border-bord bg-paper shadow-[0_18px_44px_rgba(18,55,42,0.2)] animate-[chat-pop_160ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            {panel}
          </div>,
          document.body,
        )
      : null

  return (
    <div
      ref={wrapRef}
      className={`relative min-w-0 ${desktop ? 'flex flex-1' : 'w-full'}`}
    >
      {fieldBtn}
      {portal}
    </div>
  )
}

function PickerPanel({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="flex max-h-[min(72dvh,560px)] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-bord px-4 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-[-0.2px] text-graph">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] leading-snug text-sgraph">
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-sgraph transition hover:text-forest"
          aria-label="Close picker"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">{children}</div>
      {footer ? (
        <div className="border-t border-bord px-3 py-2.5">{footer}</div>
      ) : null}
    </div>
  )
}

function OptionRow({
  label,
  active,
  onClick,
  hint,
  icon,
}: {
  label: string
  active?: boolean
  onClick: () => void
  hint?: string
  icon?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition ${
        active
          ? 'bg-mint ring-1 ring-emer/25'
          : 'hover:bg-mist/90'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          active
            ? 'bg-emer text-white shadow-[0_4px_12px_rgba(31,107,79,0.28)]'
            : 'border border-bord bg-paper text-forest'
        }`}
        aria-hidden
      >
        <Icon name={icon ?? 'pin'} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[14.5px] font-semibold ${
            active ? 'text-forest' : 'text-graph'
          }`}
        >
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block truncate text-[12px] text-sgraph">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
          active
            ? 'border-emer bg-emer text-white'
            : 'border-bord bg-paper text-transparent'
        }`}
        aria-hidden
      >
        {active ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5 10 17l9-10"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  )
}

function LocationPickerBody({
  options,
  value,
  onSelect,
  searchPlaceholder = 'Search a place…',
}: {
  options: Array<{
    label: string
    hint?: string
    icon?: string
    group?: string
  }>
  value: string
  onSelect: (label: string) => void
  searchPlaceholder?: string
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) ||
        (o.hint ?? '').toLowerCase().includes(needle),
    )
  }, [options, q])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const opt of filtered) {
      const key = opt.group ?? 'Places'
      const list = map.get(key) ?? []
      list.push(opt)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="space-y-3">
      <label className="mx-1 flex min-h-[48px] items-center gap-2.5 rounded-[16px] border border-bord bg-mist/70 px-3.5">
        <span className="text-emer">
          <Icon name="search" className="h-4 w-4" />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border-0 bg-transparent text-[14px] text-graph outline-none placeholder:text-sgraph"
          autoFocus
        />
      </label>

      {filtered.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-sgraph">
          No places match “{q.trim()}”.
        </p>
      ) : (
        grouped.map(([group, rows]) => (
          <div key={group} className="space-y-1">
            <p className="px-3 pt-1 text-[10px] font-bold tracking-[0.16em] text-sgraph uppercase">
              {GROUP_LABEL[group as keyof typeof GROUP_LABEL] ?? group}
            </p>
            {rows.map((opt) => (
              <OptionRow
                key={opt.label}
                label={opt.label}
                hint={opt.hint}
                icon={opt.icon}
                active={value === opt.label}
                onClick={() => onSelect(opt.label)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

/**
 * Mobile: prototype stacked booking UI.
 * Desktop: full-width website hero booking.
 * Functional: FROM / TO / DATE / PEOPLE pickers → catalog pages with live DB options.
 */
export function AloBookingModule({
  quickChips = QUICK_DEFAULT,
}: {
  quickChips?: string[]
}) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('move')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState(FROM_OPTIONS[0].label)
  const [to, setTo] = useState('')
  const [datePreset, setDatePreset] = useState<DatePresetId>('today')
  const [customFrom, setCustomFrom] = useState(() => toIsoDate(new Date()))
  const [customTo, setCustomTo] = useState(() => toIsoDate(new Date()))
  const [people, setPeople] = useState(2)
  const [picker, setPicker] = useState<Picker>(null)

  const dateSelection = useMemo(
    () => resolveDateSelection(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  )
  const date = dateSelection.label
  const dateFromIso = dateSelection.from
  const dateToIso = dateSelection.to

  const destQ = useQuery({
    queryKey: ['client-v2', 'destinations', 'booking-picker'],
    queryFn: () => clientV2Api.destinations(),
    staleTime: 120_000,
  })

  const toOptions = useMemo(() => {
    const rows = destQ.data?.data ?? []
    const fromApi = rows.map((d) => ({
      label: d.title,
      hint: d.tags?.slice(0, 2).join(' · ') || 'Destination',
      icon: 'pin',
      group: 'Destinations',
    }))
    const extras = [
      {
        label: 'Red Square',
        hint: 'City centre landmark',
        icon: 'pin',
        group: 'Popular',
      },
      {
        label: 'Sheremetyevo Airport',
        hint: 'SVO · north of Moscow',
        icon: 'pin',
        group: 'Airports',
      },
      {
        label: 'Domodedovo Airport',
        hint: 'DME · south of Moscow',
        icon: 'pin',
        group: 'Airports',
      },
      {
        label: 'Any hotel in Moscow',
        hint: 'Stay pickup / drop-off',
        icon: 'bed',
        group: 'Stay',
      },
    ]
    const seen = new Set<string>()
    const out: typeof extras = []
    for (const opt of [...extras, ...fromApi]) {
      if (!opt.label || seen.has(opt.label)) continue
      seen.add(opt.label)
      out.push(opt)
    }
    return out
  }, [destQ.data])

  const chips = quickChips.length ? quickChips : QUICK_DEFAULT

  const cta =
    mode === 'move'
      ? { label: 'Show the options', icon: 'car' as const }
      : mode === 'stay'
        ? { label: 'Show stays', icon: 'bed' as const }
        : { label: 'Show experiences', icon: 'ticket' as const }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      navigate('/search')
      return
    }
    const lower = q.toLowerCase()
    if (lower.includes('halal') || lower.includes('food') || lower.includes('restaurant')) {
      navigate(`/food?q=${encodeURIComponent(q)}`)
      return
    }
    if (lower.includes('car') || lower.includes('driver') || lower.includes('transfer')) {
      navigate(
        `/cars?q=${encodeURIComponent(q)}&people=${people}&date=${encodeURIComponent(dateFromIso)}&dateTo=${encodeURIComponent(dateToIso)}&from=${encodeURIComponent(from)}`,
      )
      return
    }
    if (lower.includes('hotel') || lower.includes('stay') || lower.includes('hostel')) {
      navigate(
        `/stays?q=${encodeURIComponent(q)}&people=${people}&date=${encodeURIComponent(dateFromIso)}&dateTo=${encodeURIComponent(dateToIso)}`,
      )
      return
    }
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const showOptions = () => {
    const params = new URLSearchParams()
    params.set('people', String(people))
    params.set('date', dateFromIso)
    params.set('dateTo', dateToIso)
    params.set('from', from)
    if (to) params.set('to', to)
    const qs = `?${params.toString()}`
    if (mode === 'move') navigate(`/cars${qs}`)
    else if (mode === 'stay') navigate(`/stays${qs}`)
    else navigate(`/acts${qs}`)
  }

  const peopleLabel = `${people} ${people === 1 ? 'person' : 'people'}`
  const closePicker = () => setPicker(null)
  const togglePicker = (id: NonNullable<Picker>) =>
    setPicker((cur) => (cur === id ? null : id))

  const fromPanel =
    picker === 'from' ? (
      <PickerPanel
        title="Pickup from"
        subtitle="Where should the driver meet you?"
        onClose={closePicker}
      >
        <LocationPickerBody
          options={FROM_OPTIONS}
          value={from}
          searchPlaceholder="Search pickup…"
          onSelect={(label) => {
            setFrom(label)
            closePicker()
          }}
        />
      </PickerPanel>
    ) : null

  const toPanel =
    picker === 'to' ? (
      <PickerPanel
        title={
          mode === 'stay'
            ? 'Where to stay'
            : mode === 'do'
              ? 'What to do'
              : 'Drop-off'
        }
        subtitle={
          mode === 'stay'
            ? 'Pick an area or stay style'
            : mode === 'do'
              ? 'Choose an experience or area'
              : 'Where are you heading?'
        }
        onClose={closePicker}
      >
        {destQ.isLoading ? (
          <div className="px-3 py-6">
            <InlineLoader />
          </div>
        ) : (
          <LocationPickerBody
            options={toOptions}
            value={to}
            searchPlaceholder="Search destination…"
            onSelect={(label) => {
              setTo(label)
              closePicker()
            }}
          />
        )}
      </PickerPanel>
    ) : null

  const datePanel =
    picker === 'date' ? (
      <PickerPanel
        title="When"
        subtitle="Today, tomorrow, this week, or a custom range"
        onClose={closePicker}
        footer={
          datePreset === 'custom' ? (
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center rounded-[14px] bg-emer text-sm font-semibold text-white disabled:opacity-50"
              disabled={!customFrom || !customTo || customTo < customFrom}
              onClick={closePicker}
            >
              Apply · {date}
            </button>
          ) : null
        }
      >
        <div className="space-y-0.5">
          {DATE_OPTIONS.map((opt) => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              icon="cal"
              hint={opt.hint}
              active={datePreset === opt.id}
              onClick={() => {
                setDatePreset(opt.id)
                if (opt.id !== 'custom') closePicker()
              }}
            />
          ))}
        </div>
        {datePreset === 'custom' ? (
          <DateRangeCalendar
            from={customFrom}
            to={customTo}
            onChange={({ from: f, to: t }) => {
              setCustomFrom(f)
              setCustomTo(t)
            }}
          />
        ) : null}
      </PickerPanel>
    ) : null

  const peoplePanel =
    picker === 'people' ? (
      <PickerPanel
        title="Travellers"
        subtitle="How many seats do you need?"
        onClose={closePicker}
        footer={
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded-[14px] bg-emer text-sm font-semibold text-white"
            onClick={closePicker}
          >
            Done · {peopleLabel}
          </button>
        }
      >
        <div className="mx-1 flex items-center justify-between gap-4 rounded-[18px] border border-bord bg-mist/50 px-4 py-4">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-bord bg-paper text-lg font-bold text-forest disabled:opacity-40"
            disabled={people <= 1}
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
            aria-label="Fewer people"
          >
            −
          </button>
          <div className="text-center">
            <p className="text-[28px] font-bold tracking-[-0.4px] text-graph">
              {people}
            </p>
            <p className="text-[11px] font-semibold tracking-wide text-sgraph uppercase">
              {people === 1 ? 'person' : 'people'}
            </p>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-bord bg-paper text-lg font-bold text-forest disabled:opacity-40"
            disabled={people >= 12}
            onClick={() => setPeople((n) => Math.min(12, n + 1))}
            aria-label="More people"
          >
            +
          </button>
        </div>
      </PickerPanel>
    ) : null

  const moveFields = (desktop?: boolean) => (
    <>
      <Field
        label="FROM"
        icon="nav"
        value={from}
        desktop={desktop}
        active={picker === 'from'}
        onClick={() => togglePicker('from')}
        onClose={closePicker}
        panel={fromPanel}
      />
      <Field
        label="TO"
        icon="pin"
        value={to || 'Choose a destination'}
        muted={!to}
        desktop={desktop}
        active={picker === 'to'}
        onClick={() => togglePicker('to')}
        onClose={closePicker}
        panel={toPanel}
      />
    </>
  )

  const stayFields = (desktop?: boolean) => (
    <>
      <Field
        label="WHERE"
        icon="pin"
        value={to || 'Moscow centre'}
        desktop={desktop}
        active={picker === 'to'}
        onClick={() => togglePicker('to')}
        onClose={closePicker}
        panel={toPanel}
      />
      <Field
        label="CHECK-IN"
        icon="cal"
        value={date}
        desktop={desktop}
        active={picker === 'date'}
        onClick={() => togglePicker('date')}
        onClose={closePicker}
        panel={datePanel}
      />
    </>
  )

  const doFields = (desktop?: boolean) => (
    <>
      <Field
        label="WHAT"
        icon="ticket"
        value={to || 'Things to do today'}
        desktop={desktop}
        active={picker === 'to'}
        onClick={() => togglePicker('to')}
        onClose={closePicker}
        panel={toPanel}
      />
      <Field
        label="AREA"
        icon="pin"
        value={from.includes('location') ? 'Near Red Square' : from}
        desktop={desktop}
        active={picker === 'from'}
        onClick={() => togglePicker('from')}
        onClose={closePicker}
        panel={fromPanel}
      />
    </>
  )

  const sharedFields = (desktop?: boolean) => (
    <>
      {mode === 'move' || mode === 'do' ? (
        <Field
          label="DATE"
          icon="cal"
          value={date}
          desktop={desktop}
          active={picker === 'date'}
          onClick={() => togglePicker('date')}
          onClose={closePicker}
          panel={datePanel}
        />
      ) : null}
      <Field
        label="PEOPLE"
        icon="people"
        value={peopleLabel}
        desktop={desktop}
        active={picker === 'people'}
        onClick={() => togglePicker('people')}
        onClose={closePicker}
        panel={peoplePanel}
      />
    </>
  )

  return (
    <section className="space-y-4 md:space-y-6">
      <form onSubmit={onSearch} className="flex items-center gap-2.5 md:gap-3">
        <label className="flex min-h-[52px] flex-1 items-center gap-3 rounded-[18px] border border-bord bg-paper px-4 shadow-[var(--shadow-card)] transition focus-within:border-fresh/40 focus-within:shadow-[var(--shadow-lift)] md:min-h-[58px] md:rounded-[20px] md:px-5">
          <span className="text-emer">
            <Icon name="search" className="h-[18px] w-[18px] md:h-5 md:w-5" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask aLo or search a place..."
            className="w-full border-0 bg-transparent text-[14.5px] text-graph outline-none placeholder:text-sgraph md:text-[16px]"
            aria-label="Search"
          />
        </label>
        <Link
          to="/trip"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-mint text-forest transition hover:bg-[#cfe6db] md:h-[58px] md:w-[58px] md:rounded-[18px]"
          aria-label="Ask the desk"
          title="Arabic-speaking desk"
        >
          <Icon name="headset" className="h-5 w-5" />
        </Link>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:gap-2.5 md:overflow-visible md:px-0">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setQuery(chip)
              const lower = chip.toLowerCase()
              if (lower.includes('halal') || lower.includes('food')) {
                navigate(`/food?q=${encodeURIComponent(chip)}`)
              } else if (lower.includes('car') || lower.includes('driver')) {
                navigate(
                  `/cars?q=${encodeURIComponent(chip)}&people=${people}&date=${encodeURIComponent(dateFromIso)}&dateTo=${encodeURIComponent(dateToIso)}&from=${encodeURIComponent(from)}`,
                )
              } else if (lower.includes('train')) {
                navigate('/train')
              } else {
                navigate(`/search?q=${encodeURIComponent(chip)}`)
              }
            }}
            className="shrink-0 rounded-full border border-bord bg-paper px-3.5 py-2 text-[12.5px] font-medium text-sgraph shadow-[var(--shadow-card)] transition hover:border-fresh/35 hover:bg-mist hover:text-forest md:text-[13px]"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex justify-between gap-1 pt-0.5 md:justify-start md:gap-5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={c.to}
            className="group flex w-[64px] flex-col items-center gap-1.5 md:w-auto md:min-w-[88px]"
          >
            <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-bord bg-paper text-graph shadow-[var(--shadow-card)] transition group-hover:border-fresh/40 group-hover:bg-mist group-hover:text-emer md:h-[60px] md:w-[60px]">
              <Icon name={c.icon} className="h-[22px] w-[22px]" />
            </span>
            <span className="text-[11.5px] font-medium text-graph md:text-[12.5px]">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Mobile booking card */}
      <div className="relative overflow-hidden rounded-[24px] border border-bord bg-paper shadow-[var(--shadow-card)] md:hidden">
        <div className="border-b border-bord p-1.5">
          <ModeTabs mode={mode} setMode={setMode} />
        </div>
        <div className="divide-y divide-bord px-1">
          {mode === 'move' ? moveFields() : null}
          {mode === 'stay' ? stayFields() : null}
          {mode === 'do' ? doFields() : null}
          {sharedFields()}
        </div>
        <div className="p-3 pt-2">
          <button
            type="button"
            onClick={showOptions}
            className="flex min-h-[52px] w-full items-center justify-between rounded-[18px] border border-bord bg-paper px-4 font-semibold text-graph shadow-[var(--shadow-card)]"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-emer">
                <Icon name={cta.icon} className="h-[18px] w-[18px]" />
              </span>
              {cta.label}
            </span>
            <Icon name="chev" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop booking bar — dropdown portals under the field (no layout stretch). */}
      <div className="relative hidden overflow-hidden rounded-[24px] border border-bord bg-paper shadow-[var(--shadow-lift)] md:block">
        <div className="flex items-center justify-between gap-4 border-b border-bord px-4 py-3">
          <ModeTabs mode={mode} setMode={setMode} />
          <p className="hidden text-[13px] text-sgraph lg:block">
            Arabic desk · live Moscow options
          </p>
        </div>
        <div className="flex items-stretch gap-0">
          <div className="flex min-w-0 flex-1 divide-x divide-bord">
            {mode === 'move' ? (
              <>
                {moveFields(true)}
                {sharedFields(true)}
              </>
            ) : null}
            {mode === 'stay' ? (
              <>
                {stayFields(true)}
                <Field
                  label="PEOPLE"
                  icon="people"
                  value={peopleLabel}
                  desktop
                  active={picker === 'people'}
                  onClick={() => togglePicker('people')}
                  onClose={closePicker}
                  panel={peoplePanel}
                />
              </>
            ) : null}
            {mode === 'do' ? (
              <>
                {doFields(true)}
                {sharedFields(true)}
              </>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center border-l border-bord p-3">
            <button
              type="button"
              onClick={showOptions}
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-[16px] bg-emer px-5 text-[14.5px] font-semibold text-white shadow-[0_4px_14px_rgba(31,107,79,.28)] transition hover:bg-forest"
            >
              <Icon name={cta.icon} className="h-[18px] w-[18px]" />
              {cta.label}
              <Icon name="chev" className="h-4 w-4 text-white/70" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
