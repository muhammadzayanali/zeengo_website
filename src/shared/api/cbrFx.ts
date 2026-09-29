/** Central Bank of Russia daily FX (same source as aLo client prototype). */

export const FX_CURRENCIES = [
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi riyal' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE dirham' },
  { code: 'QAR', flag: '🇶🇦', name: 'Qatari riyal' },
  { code: 'BHD', flag: '🇧🇭', name: 'Bahraini dinar' },
  { code: 'OMR', flag: '🇴🇲', name: 'Omani rial' },
  { code: 'KZT', flag: '🇰🇿', name: 'Kazakh tenge' },
  { code: 'EGP', flag: '🇪🇬', name: 'Egyptian pound' },
  { code: 'TRY', flag: '🇹🇷', name: 'Turkish lira' },
  { code: 'USD', flag: '🇺🇸', name: 'US dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese yuan' },
  { code: 'GBP', flag: '🇬🇧', name: 'Pound sterling' },
] as const

export type FxCode = (typeof FX_CURRENCIES)[number]['code']

/** Home strip order from client prototype. */
export const FX_STRIP_CODES: FxCode[] = [
  'SAR',
  'AED',
  'QAR',
  'USD',
  'EUR',
  'TRY',
  'EGP',
  'KZT',
]

export type FxRateRow = {
  nominal: number
  value: number
  previous: number
}

export type CbrFxSnapshot = {
  date: string
  timestamp?: string
  source: string
  rates: Partial<Record<FxCode, FxRateRow>>
}

type CbrJson = {
  Date?: string
  Timestamp?: string
  Valute?: Record<
    string,
    { Nominal: number; Value: number; Previous: number; Name?: string }
  >
}

const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'

export async function fetchCbrFx(): Promise<CbrFxSnapshot> {
  const res = await fetch(CBR_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('Could not load CBR rates')
  const json = (await res.json()) as CbrJson
  if (!json.Valute) throw new Error('CBR response missing rates')

  const rates: CbrFxSnapshot['rates'] = {}
  for (const c of FX_CURRENCIES) {
    const row = json.Valute[c.code]
    if (!row) continue
    rates[c.code] = {
      nominal: row.Nominal,
      value: row.Value,
      previous: row.Previous,
    }
  }

  return {
    date: (json.Date ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    timestamp: json.Timestamp,
    source: 'Central Bank of Russia daily rates',
    rates,
  }
}

/** RUB per 1 unit of foreign currency. */
export function rubPerUnit(row: FxRateRow): number {
  return row.value / row.nominal
}

export function rubPerUnitPrev(row: FxRateRow): number {
  return row.previous / row.nominal
}

export function dayChangePct(row: FxRateRow): number | null {
  const prev = rubPerUnitPrev(row)
  if (!prev) return null
  return ((rubPerUnit(row) - prev) / prev) * 100
}

export function fmtMoney(n: number, digits = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function currencyMeta(code: string) {
  return FX_CURRENCIES.find((c) => c.code === code)
}
