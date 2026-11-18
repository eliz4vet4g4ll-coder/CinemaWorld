import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AccountPage } from './pages/AccountPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ComparePage } from './pages/ComparePage';
import { DatePage } from './pages/DatePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MoviePage } from './pages/MoviePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { SeatsPage } from './pages/SeatsPage';
import { SessionsPage } from './pages/SessionsPage';
import { TicketPage } from './pages/TicketPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { CinemaFormPage } from './pages/admin/CinemaFormPage';
import { CinemasPage } from './pages/admin/CinemasPage';
import { HallFormPage } from './pages/admin/HallFormPage';
import { MovieFormPage } from './pages/admin/MovieFormPage';
import { MoviesPage } from './pages/admin/MoviesPage';
import { SessionFormPage } from './pages/admin/SessionFormPage';
import { SessionsAdminPage } from './pages/admin/SessionsAdminPage';
import { AuthProvider, RequireAuth } from './state/auth';
import { BookingProvider } from './state/booking';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Без return: в новых браузерах scrollTo возвращает промис, а React ждёт от эффекта только функцию очистки.
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <BookingProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="movies/:id" element={<MoviePage />} />
              <Route path="movies/:id/dates" element={<DatePage />} />
              <Route path="movies/:id/sessions" element={<SessionsPage />} />
              <Route path="movies/:id/compare" element={<ComparePage />} />
              <Route path="sessions/:id/seats" element={<SeatsPage />} />
              <Route path="checkout" element={<RequireAuth role="user"><CheckoutPage /></RequireAuth>} />
              <Route path="tickets/:id" element={<RequireAuth><TicketPage /></RequireAuth>} />
              <Route path="account" element={<RequireAuth role="user"><AccountPage /></RequireAuth>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="admin/login" element={<Navigate to="/login" replace />} />
            <Route path="admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
              <Route index element={<Navigate to="movies" replace />} />
              <Route path="movies" element={<MoviesPage />} />
              <Route path="movies/new" element={<MovieFormPage />} />
              <Route path="movies/:id" element={<MovieFormPage />} />
              <Route path="cinemas" element={<CinemasPage />} />
              <Route path="cinemas/new" element={<CinemaFormPage />} />
              <Route path="cinemas/:id" element={<CinemaFormPage />} />
              <Route path="cinemas/:cinemaId/halls/new" element={<HallFormPage />} />
              <Route path="cinemas/:cinemaId/halls/:id" element={<HallFormPage />} />
              <Route path="sessions" element={<SessionsAdminPage />} />
              <Route path="sessions/new" element={<SessionFormPage />} />
              <Route path="sessions/:id" element={<SessionFormPage />} />
            </Route>
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
