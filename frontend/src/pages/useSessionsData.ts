import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { toDateKey } from '../lib/format';
import { useBooking } from '../state/booking';

/** Общие данные экранов «Сеансы» и «Сравнение»: один запрос GET /sessions?movieId=…&date=… */
export function useSessionsData() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { booking, update } = useBooking();
  const date = params.get('date') ?? booking.date ?? toDateKey(new Date());

  const movie = useAsync(
    () => (String(booking.movie?.id) === id && booking.movie ? Promise.resolve(booking.movie) : api.movie(id)),
    [id],
  );
  const sessions = useAsync(() => api.sessions(id, date), [id, date]);

  useEffect(() => {
    if (movie.data) update({ movie: movie.data, date });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.data, date]);

  return { id, date, movie, sessions };
}
