import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  WEBSITE_LOCALE_OPTIONS,
  type WebsiteLocale,
} from '@/shared/i18n'
import { useWebsiteLocale } from '@/shared/i18n/useWebsiteLocale'

export function LanguageMenu({
  align = 'end',
  compact = false,
  tone = 'ink',
}: {
  align?: 'start' | 'end'
  compact?: boolean
  tone?: 'ink' | 'ivory'
}) {
  const { t } = useTranslation()
  const { locale, localeShort, setLocale } = useWebsiteLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (id: WebsiteLocale) => {
    setLocale(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language')}
        className={
          compact
            ? `inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs ${
                tone === 'ivory'
                  ? 'border-white/30 bg-white/10 text-[#F3EEE4]'
                  : 'border-bord bg-paper text-forest'
              }`
            : `inline-flex min-h-10 items-center gap-1.5 px-1 text-sm ${
                tone === 'ivory' ? 'text-[#F3EEE4]' : 'text-graph'
              }`
        }
      >
        <span aria-hidden>🌐</span>
        <span>{localeShort}</span>
        <span className="text-[10px] opacity-60" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t('language')}
          className={`absolute top-[calc(100%+8px)] z-50 min-w-[12rem] overflow-hidden rounded-[16px] border border-bord bg-paper py-1 shadow-[var(--shadow-card)] ${
            align === 'end' ? 'end-0' : 'start-0'
          }`}
        >
          {WEBSITE_LOCALE_OPTIONS.map((opt) => {
            const active = opt.id === locale
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(opt.id)}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-start text-sm transition ${
                  active
                    ? 'bg-mint font-semibold text-forest'
                    : 'text-graph hover:bg-mist'
                }`}
              >
                <span>
                  <span className="block font-semibold">{opt.name}</span>
                  <span className="block text-[11px] text-sgraph">{opt.code}</span>
                </span>
                {active ? <span aria-hidden>✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
