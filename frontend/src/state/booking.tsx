import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { Movie, Seat, Session } from '../api/types';

/** Выбор пользователя в пути покупки. Хранится в sessionStorage: «Возврат сохраняет фильм, дату, сеанс и место». */
export interface Booking {
  movie: Movie | null;
  date: string | null;
  session: Session | null;
  seat: Seat | null;
  /** Ключ попытки оформления: не меняется при повторе после сбоя. */
  attemptKey: string | null;
}

const EMPTY: Booking = { movie: null, date: null, session: null, seat: null, attemptKey: null };
const KEY = 'cw.booking';

function restore(): Booking {
  try {
    return { ...EMPTY, ...(JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Partial<Booking>) };
  } catch {
    return EMPTY;
  }
}

interface BookingValue {
  booking: Booking;
  update: (patch: Partial<Booking>) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking>(restore);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(booking));
  }, [booking]);

  const value = useMemo<BookingValue>(() => ({
    booking,
    update: (patch) => setBooking((b) => ({ ...b, ...patch })),
    reset: () => setBooking(EMPTY),
  }), [booking]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error('useBooking вне BookingProvider');
  return value;
}
