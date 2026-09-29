import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clientV2Api } from '@/shared/api/clientV2'

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

const FROM_OPTIONS = [
  'Your location in Moscow',
  'Red Square',
  'Sheremetyevo Airport',
  'Domodedovo Airport',
  'Vnukovo Airport',
  'Hotel / stay address',
]

const DATE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This weekend' },
]

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
  desktop,
}: {
  label: string
  icon: string
  value: string
  muted?: boolean
  onClick?: () => void
  desktop?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  if (desktop) {
    return (
      <Comp
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className="group flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 text-left transition hover:bg-mist/60"
      >
        <span className="mt-0.5 text-sgraph group-hover:text-emer">
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold tracking-[0.14em] text-sgraph uppercase">
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
    )
  }
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-3.5 text-left"
    >
      <span className="text-sgraph">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold tracking-[0.12em] text-sgraph uppercase">
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
}

function PickerSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-graph/35 p-3 md:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[78dvh] w-full max-w-lg overflow-hidden rounded-[24px] border border-bord bg-paper shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between border-b border-bord px-4 py-3.5">
          <p className="text-[15px] font-bold text-graph">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-sgraph"
            aria-label="Close picker"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[min(60dvh,480px)] overflow-y-auto p-2">
          {children}
        </div>
      </div>
    </div>
  )
}

function OptionRow({
  label,
  active,
  onClick,
  hint,
}: {
  label: string
  active?: boolean
  onClick: () => void
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[14px] px-3.5 py-3 text-left transition ${
        active ? 'bg-mint text-forest' : 'hover:bg-mist'
      }`}
    >
      <span>
        <span className="block text-[14.5px] font-semibold">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[11.5px] text-sgraph">{hint}</span>
        ) : null}
      </span>
      {active ? (
        <span className="text-[12px] font-bold text-emer">Selected</span>
      ) : null}
    </button>
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
  const [from, setFrom] = useState(FROM_OPTIONS[0])
  const [to, setTo] = useState('')
  const [date, setDate] = useState('Today')
  const [people, setPeople] = useState(2)
  const [picker, setPicker] = useState<Picker>(null)

  const destQ = useQuery({
    queryKey: ['client-v2', 'destinations', 'booking-picker'],
    queryFn: () => clientV2Api.destinations(),
    staleTime: 120_000,
  })

  const toOptions = useMemo(() => {
    const rows = destQ.data?.data ?? []
    const titles = rows.map((d) => d.title).filter(Boolean)
    const extras = [
      'Red Square',
      'Sheremetyevo Airport',
      'Domodedovo Airport',
      'Any hotel in Moscow',
    ]
    return [...new Set([...extras, ...titles])]
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
      navigate(`/cars?q=${encodeURIComponent(q)}&people=${people}&date=${encodeURIComponent(date)}&from=${encodeURIComponent(from)}`)
      return
    }
    if (lower.includes('hotel') || lower.includes('stay') || lower.includes('hostel')) {
      navigate(`/stays?q=${encodeURIComponent(q)}&people=${people}&date=${encodeURIComponent(date)}`)
      return
    }
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const showOptions = () => {
    const params = new URLSearchParams()
    params.set('people', String(people))
    params.set('date', date)
    params.set('from', from)
    if (to) params.set('to', to)
    const qs = `?${params.toString()}`
    if (mode === 'move') navigate(`/cars${qs}`)
    else if (mode === 'stay') navigate(`/stays${qs}`)
    else navigate(`/acts${qs}`)
  }

  const peopleLabel = `${people} ${people === 1 ? 'person' : 'people'}`

  const moveFields = (
    <>
      <Field
        label="FROM"
        icon="nav"
        value={from}
        onClick={() => setPicker('from')}
      />
      <Field
        label="TO"
        icon="pin"
        value={to || 'Choose a destination'}
        muted={!to}
        onClick={() => setPicker('to')}
      />
    </>
  )

  const stayFields = (
    <>
      <Field
        label="WHERE"
        icon="pin"
        value={to || 'Moscow centre'}
        onClick={() => setPicker('to')}
      />
      <Field
        label="CHECK-IN"
        icon="cal"
        value={date}
        onClick={() => setPicker('date')}
      />
    </>
  )

  const doFields = (
    <>
      <Field
        label="WHAT"
        icon="ticket"
        value={to || 'Things to do today'}
        onClick={() => setPicker('to')}
      />
      <Field
        label="AREA"
        icon="pin"
        value={from.includes('location') ? 'Near Red Square' : from}
        onClick={() => setPicker('from')}
      />
    </>
  )

  const sharedFields = (
    <>
      {mode === 'move' ? (
        <Field
          label="DATE"
          icon="cal"
          value={date}
          onClick={() => setPicker('date')}
        />
      ) : null}
      <Field
        label="PEOPLE"
        icon="people"
        value={peopleLabel}
        onClick={() => setPicker('people')}
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
                  `/cars?q=${encodeURIComponent(chip)}&people=${people}&date=${encodeURIComponent(date)}&from=${encodeURIComponent(from)}`,
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
      <div className="overflow-hidden rounded-[24px] border border-bord bg-paper shadow-[var(--shadow-card)] md:hidden">
        <div className="border-b border-bord p-1.5">
          <ModeTabs mode={mode} setMode={setMode} />
        </div>
        <div className="divide-y divide-bord px-1">
          {mode === 'move' ? moveFields : null}
          {mode === 'stay' ? stayFields : null}
          {mode === 'do' ? doFields : null}
          {sharedFields}
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

      {/* Desktop booking bar */}
      <div className="hidden overflow-hidden rounded-[24px] border border-bord bg-paper shadow-[var(--shadow-lift)] md:block">
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
                <Field label="FROM" icon="nav" value={from} onClick={() => setPicker('from')} desktop />
                <Field
                  label="TO"
                  icon="pin"
                  value={to || 'Choose a destination'}
                  muted={!to}
                  onClick={() => setPicker('to')}
                  desktop
                />
                <Field label="DATE" icon="cal" value={date} onClick={() => setPicker('date')} desktop />
                <Field
                  label="PEOPLE"
                  icon="people"
                  value={peopleLabel}
                  onClick={() => setPicker('people')}
                  desktop
                />
              </>
            ) : null}
            {mode === 'stay' ? (
              <>
                <Field
                  label="WHERE"
                  icon="pin"
                  value={to || 'Moscow centre'}
                  onClick={() => setPicker('to')}
                  desktop
                />
                <Field label="CHECK-IN" icon="cal" value={date} onClick={() => setPicker('date')} desktop />
                <Field
                  label="PEOPLE"
                  icon="people"
                  value={peopleLabel}
                  onClick={() => setPicker('people')}
                  desktop
                />
              </>
            ) : null}
            {mode === 'do' ? (
              <>
                <Field
                  label="WHAT"
                  icon="ticket"
                  value={to || 'Things to do today'}
                  onClick={() => setPicker('to')}
                  desktop
                />
                <Field
                  label="AREA"
                  icon="pin"
                  value={from.includes('location') ? 'Near Red Square' : from}
                  onClick={() => setPicker('from')}
                  desktop
                />
                <Field label="DATE" icon="cal" value={date} onClick={() => setPicker('date')} desktop />
                <Field
                  label="PEOPLE"
                  icon="people"
                  value={peopleLabel}
                  onClick={() => setPicker('people')}
                  desktop
                />
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

      {picker === 'from' ? (
        <PickerSheet title="From" onClose={() => setPicker(null)}>
          {FROM_OPTIONS.map((opt) => (
            <OptionRow
              key={opt}
              label={opt}
              active={from === opt}
              onClick={() => {
                setFrom(opt)
                setPicker(null)
              }}
            />
          ))}
        </PickerSheet>
      ) : null}

      {picker === 'to' ? (
        <PickerSheet
          title={mode === 'stay' ? 'Where to stay' : 'Destination'}
          onClose={() => setPicker(null)}
        >
          {destQ.isLoading ? (
            <p className="px-3 py-4 text-sm text-sgraph">Loading places…</p>
          ) : null}
          {toOptions.map((opt) => (
            <OptionRow
              key={opt}
              label={opt}
              active={to === opt}
              onClick={() => {
                setTo(opt)
                setPicker(null)
              }}
            />
          ))}
        </PickerSheet>
      ) : null}

      {picker === 'date' ? (
        <PickerSheet title="When" onClose={() => setPicker(null)}>
          {DATE_OPTIONS.map((opt) => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              active={date === opt.label}
              onClick={() => {
                setDate(opt.label)
                setPicker(null)
              }}
            />
          ))}
        </PickerSheet>
      ) : null}

      {picker === 'people' ? (
        <PickerSheet title="Travellers" onClose={() => setPicker(null)}>
          <div className="flex items-center justify-between gap-4 px-3 py-4">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-bord bg-mist text-lg font-bold text-forest disabled:opacity-40"
              disabled={people <= 1}
              onClick={() => setPeople((n) => Math.max(1, n - 1))}
              aria-label="Fewer people"
            >
              −
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-graph">{people}</p>
              <p className="text-xs text-sgraph">
                {people === 1 ? 'person' : 'people'}
              </p>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-bord bg-mist text-lg font-bold text-forest disabled:opacity-40"
              disabled={people >= 12}
              onClick={() => setPeople((n) => Math.min(12, n + 1))}
              aria-label="More people"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="mx-2 mb-2 flex min-h-12 w-[calc(100%-1rem)] items-center justify-center rounded-[14px] bg-emer font-semibold text-white"
            onClick={() => setPicker(null)}
          >
            Done
          </button>
        </PickerSheet>
      ) : null}
    </section>
  )
}
