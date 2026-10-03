import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DesktopNav } from '../navigation/Nav'
import { useAuth } from '@/shared/auth/AuthContext'
import { LanguageMenu } from './LanguageMenu'
import { BrandMark } from '@/components/ui/BrandMark'
import { TripBagButton } from '@/components/booking/BookingUi'

export function SiteHeader() {
  const { t } = useTranslation()
  const { ready, isAuthenticated, znCode } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-bord/70 bg-ivory/86 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6 md:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark size={36} rounded="lg" />
          <span className="min-w-0">
            <span className="block text-[11px] text-emer">{t('brand')}</span>
            <span className="font-display block truncate text-[19px] font-medium text-graph md:text-[21px]">
              {t('brandTitle')}
            </span>
          </span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <LanguageMenu />
          <TripBagButton />
          <Link
            to="/search"
            className="inline-flex min-h-10 items-center px-2 text-sm text-graph underline-offset-4 hover:underline"
          >
            {t('search')}
          </Link>
          {ready && isAuthenticated ? (
            <Link
              to="/bookings"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emer px-3.5 text-sm font-medium text-white"
            >
              <BrandMark size={20} rounded="md" className="ring-1 ring-white/25" />
              <span>{znCode ?? t('account')}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center rounded-full bg-emer px-3.5 text-sm font-medium text-white"
            >
              {t('znLogin')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
