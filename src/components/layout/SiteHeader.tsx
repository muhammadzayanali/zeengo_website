import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DesktopNav } from '../navigation/Nav'
import { useAuth } from '@/shared/auth/AuthContext'
import { LanguageMenu } from './LanguageMenu'
import { BrandMark } from '@/components/ui/BrandMark'
import { TripBagButton } from '@/components/booking/BookingUi'

export function SiteHeader() {
  const { t } = useTranslation()
  const { ready, isAuthenticated, znCode } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setScrolled(false)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const overHero = isHome && !scrolled

  return (
    <header
      className={
        isHome
          ? `fixed inset-x-0 top-0 z-40 transition duration-300 ${
              overHero
                ? 'border-transparent bg-transparent'
                : 'border-b border-bord/70 bg-ivory/90 backdrop-blur-md'
            }`
          : 'sticky top-0 z-40 border-b border-bord/70 bg-ivory/86 backdrop-blur-md'
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6 md:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark size={36} rounded="lg" />
          <span className="min-w-0">
            <span
              className={`block text-[11px] ${
                overHero ? 'text-[#C7A96B]' : 'text-emer'
              }`}
            >
              {t('brand')}
            </span>
            <span
              className={`font-display block truncate text-[19px] font-medium md:text-[21px] ${
                overHero ? 'text-[#F3EEE4]' : 'text-graph'
              }`}
            >
              {t('brandTitle')}
            </span>
          </span>
        </Link>
        <DesktopNav tone={overHero ? 'ivory' : 'ink'} />
        <div className="flex items-center gap-2">
          <LanguageMenu tone={overHero ? 'ivory' : 'ink'} />
          <TripBagButton
            className={
              overHero
                ? 'border-white/25 bg-white/10 text-[#F3EEE4] shadow-none'
                : ''
            }
          />
          <Link
            to="/search"
            className={`inline-flex min-h-10 items-center px-2 text-sm underline-offset-4 hover:underline ${
              overHero ? 'text-[#F3EEE4]/85' : 'text-graph'
            }`}
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
              className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium ${
                overHero
                  ? 'bg-[#F3EEE4] text-forest'
                  : 'bg-emer text-white'
              }`}
            >
              {t('znLogin')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
