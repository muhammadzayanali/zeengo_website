import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/auth/AuthContext'
import {
  buildActivityBookMessage,
  buildCarBookMessage,
  buildGuideBookMessage,
  formatBookTitle,
  openWhatsAppBook,
} from '@/shared/lib/whatsappBook'

export type CatalogRequestPayload = {
  kind: 'car' | 'stay' | 'food' | 'activity' | 'guide'
  itemId?: string
  carKind?: 'driver' | 'class'
  title: string
  arabicTitle?: string | null
  detail?: string | null
  context?: {
    date?: string
    dateTo?: string
    from?: string
    to?: string
    people?: number
    city?: string
  }
}

function splitBilingualTitle(title: string): {
  en: string
  ar: string | null
} {
  const m = title.match(/^(.+?)\s*[|·]\s*(.+)$/)
  if (m) {
    const a = m[1].trim()
    const b = m[2].trim()
    const aAr = /[\u0600-\u06FF]/.test(a)
    const bAr = /[\u0600-\u06FF]/.test(b)
    if (aAr && !bAr) return { en: b, ar: a }
    if (bAr && !aAr) return { en: a, ar: b }
  }
  const paren = title.match(/^(.+?)\s*\(([^)]*[\u0600-\u06FF][^)]*)\)\s*$/)
  if (paren) return { en: paren[1].trim(), ar: paren[2].trim() }
  return { en: title.trim(), ar: null }
}

export function buildWhatsAppMessage(
  payload: CatalogRequestPayload,
  znCode?: string | null,
): string {
  const ctx = payload.context ?? {}
  const { en, ar } = splitBilingualTitle(payload.title)
  const label = formatBookTitle(en, payload.arabicTitle ?? ar)

  if (payload.kind === 'car') {
    return buildCarBookMessage({
      title: label,
      vehicle: payload.detail,
      date: ctx.date,
      people: ctx.people,
      znCode,
    })
  }

  if (payload.kind === 'guide') {
    return buildGuideBookMessage({
      title: label,
      detail: payload.detail,
      date: ctx.date,
      people: ctx.people,
      znCode,
    })
  }

  return buildActivityBookMessage(label, znCode)
}

export function CatalogRequestButton({
  label,
  payload,
}: {
  label?: string
  payload: CatalogRequestPayload
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { znCode } = useAuth()

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={() =>
          navigate('/book/request', { state: { payload } })
        }
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-emer px-4 text-sm font-semibold text-white"
      >
        {label ?? 'Request booking'}
      </button>
      <button
        type="button"
        onClick={() =>
          openWhatsAppBook(buildWhatsAppMessage(payload, znCode))
        }
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-white px-4 text-sm font-semibold text-graph"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        {t('bookWhatsApp')}
      </button>
      <p className="text-center text-[11px] text-sgraph">
        {znCode
          ? `WhatsApp will include your booking code ${znCode}.`
          : 'Platform request creates a real ZEEN booking. WhatsApp is a desk fallback — it does not create a duplicate booking.'}
      </p>
    </div>
  )
}
