import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import ar from './locales/ar'
import ru from './locales/ru'

export type WebsiteLocale = 'en' | 'ar' | 'ru'

export const WEBSITE_LOCALES: WebsiteLocale[] = ['en', 'ar', 'ru']

const LOCALE_KEY = 'alo_locale'

export function normalizeLocale(raw: string | null | undefined): WebsiteLocale {
  if (raw === 'ar' || raw === 'ru') return raw
  return 'en'
}

export function localeShort(locale: WebsiteLocale): string {
  if (locale === 'ar') return 'AR'
  if (locale === 'ru') return 'RU'
  return 'EN'
}

export const WEBSITE_LOCALE_OPTIONS: Array<{
  id: WebsiteLocale
  code: string
  name: string
}> = [
  { id: 'en', code: 'EN', name: 'English' },
  { id: 'ar', code: 'AR', name: 'العربية' },
  { id: 'ru', code: 'RU', name: 'Русский' },
]

export function nextLocale(locale: WebsiteLocale): WebsiteLocale {
  const i = WEBSITE_LOCALES.indexOf(locale)
  return WEBSITE_LOCALES[(i + 1) % WEBSITE_LOCALES.length]!
}

export function applyDocumentLocale(locale: WebsiteLocale) {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

const initial = normalizeLocale(
  typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : 'en',
)

if (typeof document !== 'undefined') {
  applyDocumentLocale(initial)
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    ru: { translation: ru },
  },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function persistLocale(locale: WebsiteLocale) {
  localStorage.setItem(LOCALE_KEY, locale)
  applyDocumentLocale(locale)
  void i18n.changeLanguage(locale)
}

export default i18n
