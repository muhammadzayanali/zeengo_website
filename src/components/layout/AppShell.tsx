import { useTranslation } from 'react-i18next'
import { SiteHeader } from './SiteHeader'
import { BottomNav } from '../navigation/Nav'
import { LanguageMenu } from './LanguageMenu'
import { PageTransition } from './PageTransition'

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
        <p className="text-[11px] font-bold tracking-[0.18em] text-emer uppercase">
          {t('brand')}
        </p>
        <LanguageMenu compact />
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-12 md:pt-4">
        <PageTransition />
      </main>
      <BottomNav />
    </div>
  )
}
