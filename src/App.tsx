import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/shared/auth/AuthContext'
import { TripBagProvider } from '@/shared/trip/TripBag'
import { queryClient } from '@/shared/api/queryClient'
import { LoadingBlock } from '@/components/ui/Primitives'
import { HomePage } from '@/pages/HomePage'
import { PlaceDetailPage } from '@/pages/PlacesPage'
import { AroundPage, ExplorePage } from '@/pages/PrimaryTabs'
import {
  AccountPage,
  LoginPage,
  MyTripPage,
} from '@/pages/CustomerAuthPages'
import { MoneyPage } from '@/pages/HubPages'
import {
  FoodCatalogPage,
  SearchCatalogPage,
} from '@/pages/CatalogPages'

const ListingResultsPage = lazy(() => import('@/pages/ListingPages').then((m) => ({ default: m.ListingResultsPage })))
const ListingDetailPage = lazy(() => import('@/pages/ListingPages').then((m) => ({ default: m.ListingDetailPage })))
const TransportPage = lazy(() => import('@/pages/MovePages').then((m) => ({ default: m.TransportPage })))
const TrainsPage = lazy(() => import('@/pages/MovePages').then((m) => ({ default: m.TrainsPage })))
const BookingDetailsPage = lazy(() => import('@/pages/BookingFlowPages').then((m) => ({ default: m.BookingDetailsPage })))
const BookingReviewPage = lazy(() => import('@/pages/BookingFlowPages').then((m) => ({ default: m.BookingReviewPage })))
const BookingConfirmationPage = lazy(() => import('@/pages/BookingFlowPages').then((m) => ({ default: m.BookingConfirmationPage })))
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPages').then((m) => ({ default: m.MyBookingsPage })))
const BookingStatusPage = lazy(() => import('@/pages/MyBookingsPages').then((m) => ({ default: m.BookingStatusPage })))

function PlaceRoute() {
  const { id = '' } = useParams()
  return <PlaceDetailPage id={id} />
}

/** Old routes keep working and carry their search params to the new pages. */
function RedirectKeepQuery({ to }: { to: string }) {
  const { search } = useLocation()
  return <Navigate to={`${to}${search}`} replace />
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingBlock />}>{children}</Suspense>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TripBagProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="around" element={<AroundPage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="trip" element={<MyTripPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="login" element={<LoginPage />} />

                <Route path="hotels" element={<Lazy><ListingResultsPage key="hotel" kind="hotel" /></Lazy>} />
                <Route path="hotels/:id" element={<Lazy><ListingDetailPage key="hotel" kind="hotel" /></Lazy>} />
                <Route path="experiences" element={<Lazy><ListingResultsPage key="activity" kind="activity" /></Lazy>} />
                <Route path="experiences/:id" element={<Lazy><ListingDetailPage key="activity" kind="activity" /></Lazy>} />
                <Route path="guides" element={<Lazy><ListingResultsPage key="guide" kind="guide" /></Lazy>} />
                <Route path="guides/:id" element={<Lazy><ListingDetailPage key="guide" kind="guide" /></Lazy>} />
                <Route path="restaurants" element={<Lazy><ListingResultsPage key="restaurant" kind="restaurant" /></Lazy>} />
                <Route path="restaurants/:id" element={<Lazy><ListingDetailPage key="restaurant" kind="restaurant" /></Lazy>} />
                <Route path="transport" element={<Lazy><TransportPage /></Lazy>} />
                <Route path="trains" element={<Lazy><TrainsPage /></Lazy>} />

                <Route path="booking/details" element={<Lazy><BookingDetailsPage /></Lazy>} />
                <Route path="booking/review" element={<Lazy><BookingReviewPage /></Lazy>} />
                <Route path="booking/confirmation" element={<Lazy><BookingConfirmationPage /></Lazy>} />
                <Route path="bookings" element={<Lazy><MyBookingsPage /></Lazy>} />
                <Route path="bookings/:zn" element={<Lazy><BookingStatusPage /></Lazy>} />

                <Route path="stays" element={<RedirectKeepQuery to="/hotels" />} />
                <Route path="acts" element={<RedirectKeepQuery to="/experiences" />} />
                <Route path="cars" element={<RedirectKeepQuery to="/transport" />} />
                <Route path="train" element={<RedirectKeepQuery to="/trains" />} />
                <Route path="book/request" element={<Navigate to="/booking/details" replace />} />
                <Route path="plan" element={<Navigate to="/trip" replace />} />
                <Route path="places" element={<Navigate to="/around" replace />} />
                <Route path="places/:id" element={<PlaceRoute />} />
                <Route path="food" element={<FoodCatalogPage />} />
                <Route path="money" element={<MoneyPage />} />
                <Route path="search" element={<SearchCatalogPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TripBagProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
