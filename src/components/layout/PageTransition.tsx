import { Outlet, useLocation } from 'react-router-dom'

/**
 * Soft enter animation on route change so screens feel connected, not abrupt.
 */
export function PageTransition() {
  const location = useLocation()

  return (
    <div
      key={`${location.pathname}${location.search}`}
      className="animate-page-enter"
    >
      <Outlet />
    </div>
  )
}
