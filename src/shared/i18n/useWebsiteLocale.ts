import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  localeShort,
  nextLocale,
  normalizeLocale,
  persistLocale,
  type WebsiteLocale,
} from '@/shared/i18n'

const LOCALE_KEY = 'alo_locale'

export function useWebsiteLocale() {
  const { i18n } = useTranslation()
  const [locale, setLocaleState] = useState<WebsiteLocale>(() =>
    normalizeLocale(localStorage.getItem(LOCALE_KEY)),
  )

  useEffect(() => {
    persistLocale(locale)
  }, [locale])

  useEffect(() => {
    const onLang = (lng: string) => setLocaleState(normalizeLocale(lng))
    i18n.on('languageChanged', onLang)
    return () => {
      i18n.off('languageChanged', onLang)
    }
  }, [i18n])

  return {
    locale,
    localeShort: localeShort(locale),
    setLocale: setLocaleState,
    cycleLocale: () => setLocaleState((l) => nextLocale(l)),
  }
}
