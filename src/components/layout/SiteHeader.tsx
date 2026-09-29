import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DesktopNav } from '../navigation/Nav'
import { useAuth } from '@/shared/auth/AuthContext'
import { LanguageMenu } from './LanguageMenu'
import { BrandMark } from '@/components/ui/BrandMark'

export function SiteHeader() {
  const { t } = useTranslation()
  const { ready, isAuthenticated, znCode } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-ivory/90 backdrop-blur-xl data-[stuck]:border-bord">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark size={40} rounded="lg" />
          <span className="min-w-0">
            <span className="block text-[11px] font-bold tracking-[0.22em] text-emer uppercase">
              {t('brand')}
            </span>
            <span className="block truncate text-lg font-bold tracking-[-0.3px] text-graph md:text-xl">
              {t('brandTitle')}
            </span>
          </span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <LanguageMenu />
          <Link
            to="/search"
            className="inline-flex min-h-10 items-center rounded-[13px] border border-bord bg-paper px-3 text-sm font-semibold text-graph shadow-[var(--shadow-card)]"
          >
            {t('search')}
          </Link>
          {ready && isAuthenticated ? (
            <Link
              to="/account"
              className="inline-flex min-h-10 items-center gap-2 rounded-[13px] bg-emer px-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)]"
            >
              <BrandMark size={22} rounded="md" className="ring-1 ring-white/25" />
              <span>{znCode ?? t('account')}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center rounded-[13px] bg-emer px-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(31,107,79,.22)]"
            >
              {t('znLogin')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
