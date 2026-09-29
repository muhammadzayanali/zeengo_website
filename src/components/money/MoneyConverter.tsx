import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FX_CURRENCIES,
  FX_STRIP_CODES,
  dayChangePct,
  fetchCbrFx,
  fmtMoney,
  rubPerUnit,
  type FxCode,
} from '@/shared/api/cbrFx'
import { ErrorBlock, LoadingBlock } from '@/components/ui/Primitives'
import { openWhatsAppBook } from '@/shared/lib/whatsappBook'

const QUICK_AMOUNTS = [100, 500, 1_000, 5_000]

const MONEY_TIPS = [
  {
    id: 'cards',
    tone: 'warn' as const,
    title: 'Cards issued outside Russia',
    ar: 'البطاقات الأجنبية',
    body: 'Visa and Mastercard issued abroad are normally declined in Russian shops, ATMs and taxis. Plan on cash, a Mir card, or let ZEEN pay and settle later.',
  },
  {
    id: 'cash',
    tone: 'ok' as const,
    title: 'Cash is king',
    ar: 'الكاش أولاً',
    body: 'Change at official exchangers near Red Square or your hotel. Keep small notes for metro, tips, and markets.',
  },
  {
    id: 'zeen',
    tone: 'ok' as const,
    title: 'Pay through ZEEN',
    ar: 'ادفع عبر زين',
    body: 'Ask the desk to cover tickets, stays, and transfers. You settle in SAR / AED / card via MyFatoorah — no Russian banking needed.',
  },
]

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct == null || Number.isNaN(pct)) return null
  const up = pct >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        up ? 'text-emer' : 'text-[#9b2c2c]'
      }`}
    >
      {up ? '▲' : '▼'} {fmtMoney(Math.abs(pct), 2)}%
    </span>
  )
}

export function MoneyTodayStrip() {
  const q = useQuery({
    queryKey: ['cbr-fx'],
    queryFn: fetchCbrFx,
    staleTime: 30 * 60_000,
    retry: 1,
  })

  if (q.isLoading) {
    return (
      <div className="mb-5 rounded-[18px] border border-bord bg-paper px-4 py-3 text-[13px] text-sgraph shadow-[var(--shadow-card)]">
        Loading CBR rates…
      </div>
    )
  }

  if (q.isError || !q.data) return null

  const { date, rates } = q.data

  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-bold tracking-[-0.3px] text-graph md:text-[20px]">
          Money today
        </h2>
        <Link
          to="/money"
          className="text-[12px] font-bold text-emer hover:underline"
        >
          Converter ›
        </Link>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FX_STRIP_CODES.map((code) => {
          const row = rates[code]
          if (!row) return null
          const meta = FX_CURRENCIES.find((c) => c.code === code)!
          return (
            <Link
              key={code}
              to={`/money?from=${code}`}
              className="min-w-[112px] shrink-0 rounded-[16px] border border-bord bg-paper px-3 py-2.5 shadow-[var(--shadow-card)] transition hover:border-fresh/40 active:scale-[0.98]"
            >
              <p className="text-[10px] font-bold tracking-[0.12em] text-[#a67c3d] uppercase">
                {meta.flag} 1 {code}
              </p>
              <p className="mt-1 text-[15px] font-bold tabular-nums text-graph">
                {fmtMoney(rubPerUnit(row), 2)} ₽
              </p>
              <div className="mt-0.5">
                <ChangeBadge pct={dayChangePct(row)} />
              </div>
            </Link>
          )
        })}
        <Link
          to="/money"
          className="flex min-w-[112px] shrink-0 flex-col justify-center rounded-[16px] bg-forest px-3 py-2.5 text-[#c6f06a] shadow-[var(--shadow-card)] transition active:scale-[0.98]"
        >
          <p className="text-[10px] font-extrabold tracking-[0.12em] uppercase">
            Full list
          </p>
          <p className="mt-1 text-[13px] font-bold">12 currencies ›</p>
        </Link>
      </div>
      <p className="mt-2 text-[11px] text-sgraph">CBR · {date}</p>
    </section>
  )
}

export function MoneyInMoscowPage() {
  const [searchParams] = useSearchParams()
  const fromParam = (searchParams.get('from') || 'SAR').toUpperCase()
  const initialFrom = (
    FX_CURRENCIES.some((c) => c.code === fromParam) ? fromParam : 'SAR'
  ) as FxCode

  const [amount, setAmount] = useState('100')
  const [code, setCode] = useState<FxCode>(initialFrom)
  const [reversed, setReversed] = useState(false)

  useEffect(() => {
    setCode(initialFrom)
  }, [initialFrom])

  const q = useQuery({
    queryKey: ['cbr-fx'],
    queryFn: fetchCbrFx,
    staleTime: 30 * 60_000,
    retry: 1,
  })

  const row = q.data?.rates[code]
  const rate = row ? rubPerUnit(row) : 0
  const amt = Number.parseFloat(amount.replace(',', '.')) || 0

  const result = useMemo(() => {
    if (!rate) return 0
    return reversed ? amt / rate : amt * rate
  }, [amt, rate, reversed])

  const resultLabel = reversed
    ? `${fmtMoney(result, code === 'BHD' || code === 'OMR' ? 3 : 2)} ${code}`
    : `${fmtMoney(result, 0)} ₽`

  const fromLabel = reversed ? 'RUB' : code
  const toLabel = reversed ? code : 'RUB'

  if (q.isLoading) return <LoadingBlock label="Loading Central Bank rates…" />
  if (q.isError || !q.data) {
    return (
      <ErrorBlock
        message={
          q.error instanceof Error
            ? q.error.message
            : 'Could not load CBR rates'
        }
        onRetry={() => void q.refetch()}
      />
    )
  }

  const meta = FX_CURRENCIES.find((c) => c.code === code)!
  const allCodes = FX_CURRENCIES.filter((c) => q.data.rates[c.code])

  return (
    <div className="pb-6 md:pb-2">
      {/* Mobile top bar only — desktop already has SiteHeader */}
      <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
        <Link
          to="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-bord bg-paper text-graph shadow-[var(--shadow-card)]"
          aria-label="Back to home"
        >
          ←
        </Link>
        <span className="rounded-full bg-mint px-3 py-1 text-[11px] font-bold text-forest">
          Live · CBR
        </span>
        <button
          type="button"
          onClick={() => void q.refetch()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-bord bg-paper text-emer shadow-[var(--shadow-card)]"
          aria-label="Refresh rates"
        >
          ↻
        </button>
      </div>

      <header className="max-w-2xl">
        <p className="hidden text-[12px] font-bold tracking-[0.16em] text-emer uppercase md:block">
          Central Bank of Russia · {q.data.date}
        </p>
        <h1 className="mt-1 text-[32px] leading-[1.08] font-bold tracking-[-0.55px] text-graph md:text-[42px]">
          Money in Moscow
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-sgraph md:text-[15px]">
          Live rates updated every working day. Convert Gulf currencies to
          roubles — and know how payment works on the ground.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Converter column */}
        <div className="lg:col-span-5">
          <div className="rounded-[22px] border border-bord bg-paper p-4 shadow-[var(--shadow-card)] md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold tracking-[0.1em] text-sgraph uppercase">
                Converter
              </p>
              <button
                type="button"
                onClick={() => void q.refetch()}
                className="hidden text-[12px] font-semibold text-emer hover:underline md:inline"
              >
                Refresh
              </button>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold tracking-[0.08em] text-sgraph uppercase">
                You have · {fromLabel}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full border-0 bg-transparent text-[40px] font-bold tracking-[-0.7px] text-forest outline-none tabular-nums placeholder:text-sgraph/40"
                aria-label="Amount"
                placeholder="0"
              />
            </label>

            <div className="mt-1 flex items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Currency</span>
                <select
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value as FxCode)
                    setReversed(false)
                  }}
                  className="w-full appearance-none rounded-[14px] border border-bord bg-mist px-3.5 py-3 pr-9 text-[14px] font-semibold text-graph outline-none focus:border-fresh/50"
                >
                  {FX_CURRENCIES.map((c) => (
                    <option
                      key={c.code}
                      value={c.code}
                      disabled={!q.data.rates[c.code]}
                    >
                      {c.flag} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sgraph"
                  aria-hidden
                >
                  ▾
                </span>
              </label>
              <button
                type="button"
                onClick={() => setReversed((r) => !r)}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border border-[#cfe3d9] bg-mint text-[17px] font-bold text-emer transition hover:bg-[#d8efe4] active:scale-95"
                aria-label="Swap currencies"
                title="Swap direction"
              >
                ⇄
              </button>
            </div>

            <div className="relative mt-4">
              <div
                className="absolute -top-2.5 left-4 rounded-full bg-paper px-2 text-[10px] font-bold tracking-[0.08em] text-sgraph uppercase"
                aria-hidden
              >
                You get · {toLabel}
              </div>
              <div className="rounded-[16px] bg-forest px-4 pt-5 pb-4 text-white">
                <p className="text-[30px] font-bold tracking-[-0.45px] tabular-nums md:text-[34px]">
                  {rate ? resultLabel : '—'}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-white/75">
                  {rate
                    ? `1 ${code} = ${fmtMoney(rate, 4)} ₽ · rate of ${q.data.date}`
                    : 'Rate unavailable for this currency'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                    amount === String(n)
                      ? 'bg-emer text-white'
                      : 'border border-bord bg-mist text-forest hover:bg-mint'
                  }`}
                >
                  {fmtMoney(n, 0)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              openWhatsAppBook(
                'Hello ZEEN, I have a question about money and payment in Moscow. Code ZEEN20.',
              )
            }
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-bord bg-paper text-sm font-semibold text-forest shadow-[var(--shadow-card)] transition hover:border-fresh/40"
          >
            Ask ZEEN about paying in Moscow
          </button>
        </div>

        {/* Tips + tables */}
        <div className="space-y-6 lg:col-span-7">
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-bold tracking-[-0.3px] text-graph md:text-[20px]">
                Money in real life
              </h2>
              <span className="text-[12px] font-semibold text-sgraph" dir="rtl">
                نصائح عملية
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {MONEY_TIPS.map((tip) => (
                <article
                  key={tip.id}
                  className={`rounded-[18px] border bg-paper p-4 shadow-[var(--shadow-card)] ${
                    tip.tone === 'warn'
                      ? 'border-[rgba(184,128,31,0.35)]'
                      : 'border-bord'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[15px] ${
                        tip.tone === 'warn'
                          ? 'bg-[#f7eccf] text-[#8A6011]'
                          : 'bg-mint text-emer'
                      }`}
                      aria-hidden
                    >
                      {tip.tone === 'warn' ? '!' : '✓'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-bold text-graph">
                        {tip.title}
                      </h3>
                      <p
                        className="mt-0.5 text-[12px] font-semibold text-sgraph"
                        dir="rtl"
                      >
                        {tip.ar}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-sgraph">
                    {tip.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-bold tracking-[-0.3px] text-graph">
                Quick amounts
              </h2>
              <span className="text-[11px] font-semibold tracking-[0.06em] text-sgraph uppercase">
                {fromLabel} → {toLabel}
              </span>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-bord bg-paper shadow-[var(--shadow-card)]">
              {QUICK_AMOUNTS.map((n, i) => {
                const converted = rate
                  ? reversed
                    ? n / rate
                    : n * rate
                  : 0
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(String(n))}
                    className={`flex w-full items-center justify-between px-4 py-3.5 text-start transition hover:bg-mist/70 ${
                      i > 0 ? 'border-t border-bord' : ''
                    } ${amount === String(n) ? 'bg-mint/35' : ''}`}
                  >
                    <span className="text-[14px] text-sgraph">
                      {reversed
                        ? `${fmtMoney(n, 0)} ₽`
                        : `${fmtMoney(n, 0)} ${code}`}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums text-graph">
                      {reversed
                        ? `${fmtMoney(converted, 2)} ${code}`
                        : `${fmtMoney(converted, 0)} ₽`}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-bold tracking-[-0.3px] text-graph">
                All rates
              </h2>
              <span className="text-[11px] font-semibold tracking-[0.06em] text-sgraph uppercase">
                1 unit in ₽ · vs yesterday
              </span>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-bord bg-paper shadow-[var(--shadow-card)]">
              <div className="max-h-[420px] overflow-y-auto overscroll-contain">
                {allCodes.map((c, i) => {
                  const r = q.data.rates[c.code]!
                  const active = c.code === code
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCode(c.code)
                        setReversed(false)
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-start transition ${
                        i > 0 ? 'border-t border-bord' : ''
                      } ${active ? 'bg-mint/45' : 'hover:bg-mist/60'}`}
                    >
                      <span className="text-[20px]" aria-hidden>
                        {c.flag}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-graph">
                          {c.code}
                        </span>
                        <span className="block truncate text-[12px] text-sgraph">
                          {c.name}
                        </span>
                      </span>
                      <span className="text-end">
                        <span className="block text-[14px] font-bold tabular-nums text-graph">
                          {fmtMoney(rubPerUnit(r), 2)} ₽
                        </span>
                        <ChangeBadge pct={dayChangePct(r)} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="mt-3 text-center text-[12px] text-sgraph">
              Source: {q.data.source}. Selected {meta.flag} {meta.name}.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
