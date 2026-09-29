import { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Soft enter animation on route change + always land at the top of the new screen.
 * Fixes SPA scroll bleed (e.g. Home mid-page → Converter still scrolled halfway).
 */
export function PageTransition() {
  const location = useLocation()

  useLayoutEffect(() => {
    const reset = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    reset()
    // Catch late layout (images / async route content)
    const t = window.setTimeout(reset, 0)
    return () => window.clearTimeout(t)
  }, [location.pathname, location.search])

  return (
    <div
      key={`${location.pathname}${location.search}`}
      className="animate-page-enter"
    >
      <Outlet />
    </div>
  )
}
