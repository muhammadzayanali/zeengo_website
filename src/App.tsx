import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/shared/auth/AuthContext'
import { queryClient } from '@/shared/api/queryClient'
import { HomePage } from '@/pages/HomePage'
import { PlaceDetailPage } from '@/pages/PlacesPage'
import { AroundPage, ExplorePage } from '@/pages/PrimaryTabs'
import {
  AccountPage,
  LoginPage,
  MyTripPage,
} from '@/pages/CustomerAuthPages'
import { MoneyPage, SimpleHub } from '@/pages/HubPages'
import { BookingRequestPage } from '@/pages/BookingRequestPage'
import {
  CarsPage,
  FoodCatalogPage,
  SearchCatalogPage,
  StaysCatalogPage,
  ActivitiesCatalogPage,
  GuidesCatalogPage,
} from '@/pages/CatalogPages'

function PlaceRoute() {
  const { id = '' } = useParams()
  return <PlaceDetailPage id={id} />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="around" element={<AroundPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="trip" element={<MyTripPage />} />
              <Route path="book/request" element={<BookingRequestPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="stays" element={<StaysCatalogPage />} />
              <Route path="acts" element={<ActivitiesCatalogPage />} />
              <Route path="guides" element={<GuidesCatalogPage />} />
              <Route path="plan" element={<Navigate to="/trip" replace />} />
              <Route path="places" element={<Navigate to="/around" replace />} />
              <Route path="places/:id" element={<PlaceRoute />} />
              <Route path="food" element={<FoodCatalogPage />} />
              <Route path="cars" element={<CarsPage />} />
              <Route path="money" element={<MoneyPage />} />
              <Route path="search" element={<SearchCatalogPage />} />
              <Route
                path="train"
                element={
                  <SimpleHub
                    title="Train tickets from Moscow"
                    body="Train booking is not live on this website yet. Sign in with your ZN code on Account, or ask your ZEEN desk to add trains to your booking."
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
