import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** v4 prototype tabs: Home · Around · Explore · My trip · Account */
export const primaryTabDefs = [
  { to: '/', key: 'home' as const, end: true, icon: 'home' as const },
  { to: '/around', key: 'around' as const, icon: 'compass' as const },
  { to: '/explore', key: 'explore' as const, icon: 'grid' as const },
  { to: '/trip', key: 'trip' as const, icon: 'route' as const },
  { to: '/account', key: 'account' as const, icon: 'user' as const },
] as const

function TabIcon({
  icon,
  active,
}: {
  icon: (typeof primaryTabDefs)[number]['icon']
  active: boolean
}) {
  const stroke = active ? '#1F6B4F' : '#8A938E'
  const common = {
    width: 23,
    height: 23,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: active ? 2.1 : 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (icon) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m16.2 7.8-2.9 6.4-6.4 2.9 2.9-6.4Z" />
        </svg>
      )
    case 'grid':
      return (
        <svg {...common}>
          <path d="M12 3.2l2.1 5.2 5.2 2.1-5.2 2.1L12 17.8l-2.1-5.2-5.2-2.1 5.2-2.1z" />
          <path d="M18.4 16.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
        </svg>
      )
    case 'route':
      return (
        <svg {...common}>
          <path d="M9 7h6.5a3 3 0 0 1 0 6H8.5a3 3 0 0 0 0 6H16" />
          <circle cx="6" cy="7" r="2.6" />
          <circle cx="18.4" cy="19" r="2.4" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19.2c1.6-3 3.8-4.4 6.5-4.4s4.9 1.4 6.5 4.4" />
        </svg>
      )
  }
}

export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-[78px] border-t border-bord bg-ivory/95 px-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      {primaryTabDefs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={'end' in tab ? tab.end : false}
          className={({ isActive }) =>
            `relative flex min-h-[52px] flex-1 flex-col items-center gap-0.5 px-0.5 text-[10px] font-medium ${
              isActive ? 'font-semibold text-forest' : 'text-[#8A938E]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex h-6 w-6 items-center justify-center">
                <TabIcon icon={tab.icon} active={isActive} />
              </span>
              <span>{t(`nav.${tab.key}`)}</span>
              {isActive ? (
                <span className="absolute inset-x-4 bottom-0 h-[2.5px] rounded-full bg-emer" />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function DesktopNav({
  tone = 'ink',
}: {
  tone?: 'ink' | 'ivory'
}) {
  const { t } = useTranslation()
  const light = tone === 'ivory'
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {primaryTabDefs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={'end' in tab ? tab.end : false}
          className={({ isActive }) =>
            `px-2.5 py-2 text-[14.5px] transition ${
              light
                ? isActive
                  ? 'font-medium text-[#F3EEE4] underline decoration-[#C7A96B] decoration-1 underline-offset-[10px]'
                  : 'text-[#F3EEE4]/72 hover:text-[#F3EEE4]'
                : isActive
                  ? 'font-medium text-forest underline decoration-champ decoration-1 underline-offset-[10px]'
                  : 'text-sgraph hover:text-graph'
            }`
          }
        >
          {t(`nav.${tab.key}`)}
        </NavLink>
      ))}
    </nav>
  )
}
