/**
 * aLo Russia WhatsApp booking helpers — mirrors
 * aLo-Russia-app-v4.2.0.html (Z.waL / Z.rp_msg / Z.csMsg / Z.gdMsg).
 */

const DEFAULT_WA = '79361323117'
const PROMO_CODE = 'ZEEN20'

export function getZeenWhatsAppPhone(): string {
  const raw =
    (import.meta.env.VITE_WHATSAPP_PHONE as string | undefined)?.trim() ||
    DEFAULT_WA
  return raw.replace(/\D/g, '') || DEFAULT_WA
}

/** Display label: "English (العربية)" when both exist. */
export function formatBookTitle(
  title: string,
  arabicTitle?: string | null,
): string {
  const t = title.trim()
  const ar = arabicTitle?.trim()
  if (!ar || ar === t) return t
  if (t.includes(ar) || /\([\u0600-\u06FF]/.test(t)) return t
  return `${t} (${ar})`
}

/** Activity / stay / food — Z.rp_msg */
export function buildActivityBookMessage(itemLabel: string): string {
  return `Hello ZEEN, I would like to book: ${itemLabel}. Code ${PROMO_CODE} (20% off). Could you send me the price and the available times?`
}

/** Cars — Z.rp_csMsg */
export function buildCarBookMessage(opts: {
  title: string
  vehicle?: string | null
  date?: string | null
  people?: number | null
  duration?: string | null
}): string {
  const bits = [
    `Hello ZEEN, I would like a car with a driver: ${opts.title}`,
    opts.vehicle ? ` (${opts.vehicle})` : '',
    '.',
    opts.date ? ` Date: ${opts.date}.` : '',
    opts.duration ? ` Duration: ${opts.duration}.` : '',
    opts.people != null ? ` Passengers: ${opts.people}.` : '',
    ` Please confirm the car and the final price. Code ${PROMO_CODE}.`,
  ]
  return bits.join('')
}

/** Guides — Z.rp_gdMsg */
export function buildGuideBookMessage(opts: {
  title: string
  detail?: string | null
  date?: string | null
  people?: number | null
}): string {
  const bits = [
    `Hello ZEEN, I would like a guide: ${opts.title}`,
    opts.detail ? ` (${opts.detail})` : '',
    '.',
    opts.date ? ` Date: ${opts.date}.` : '',
    opts.people != null ? ` People: ${opts.people}.` : '',
    ` Please confirm the guide and the meeting point. Code ${PROMO_CODE}.`,
  ]
  return bits.join('')
}

export function buildWhatsAppBookUrl(message: string): string {
  const phone = getZeenWhatsAppPhone()
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppBook(message: string): void {
  const url = buildWhatsAppBookUrl(message)
  window.open(url, '_blank', 'noopener,noreferrer')
}
