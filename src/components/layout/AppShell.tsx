import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
import { BottomNav } from '../navigation/Nav'
import { LanguageMenu } from './LanguageMenu'
import { PageTransition } from './PageTransition'
import { BrandMark } from '@/components/ui/BrandMark'
import { AddedToTripToast, TripBagButton } from '@/components/booking/BookingUi'

/**
 * Desktop = full-width website (header + max-width content).
 * Mobile = prototype app chrome (no marketing header; bottom tabs only).
 * Never a phone/device frame.
 */
export function AppShell() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh bg-ivory text-graph">
      <div className="hidden md:block">
        <SiteHeader />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark size={28} rounded="md" />
          <p className="text-[12px] text-emer">{t('brand')}</p>
        </Link>
        <div className="flex items-center gap-2">
          <TripBagButton className="min-h-9 px-2.5" />
          <LanguageMenu compact />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-12 md:pt-4">
        <PageTransition />
      </main>
      <AddedToTripToast />
      <BottomNav />
    </div>
  )
}
