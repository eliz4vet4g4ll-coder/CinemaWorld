import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Poster } from '../components/Poster';
import { Stepper } from '../components/Stepper';
import { useAsync } from '../hooks/useAsync';
import { dayMonthShort, fromDateKey, fullDateWeekday, upcomingDates, weekdayShort } from '../lib/format';
import { useBooking } from '../state/booking';

export function DatePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const { data: movie, loading, error, reload } = useAsync(() => api.movie(id), [id]);

  const dates = useMemo(() => upcomingDates(), []);
  const [date, setDate] = useState(() => (booking.date && dates.includes(booking.date) ? booking.date : dates[0]));

  useEffect(() => {
    // Выбран другой фильм: прошлый сеанс и место к нему уже не относятся.
    if (movie && String(booking.movie?.id) !== String(movie.id)) update({ movie, session: null, seat: null, attemptKey: null });
    else if (movie) update({ movie });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie]);

  if (loading) return <div className="container"><Loading /></div>;
  if (error || !movie) {
    return (
      <div className="container">
        <Feedback tone="error" title="Не удалось получить данные" text="Повторите попытку.">
          {error?.status === 404 ? <ButtonLink to="/catalog">В каталог</ButtonLink> : <Button onClick={reload}>Повторить</Button>}
        </Feedback>
      </div>
    );
  }

  const show = () => {
    update({ date });
    navigate(`/movies/${movie.id}/sessions?date=${date}`);
  };

  return (
    <div className="container">
      <BackLink to={`/movies/${movie.id}`}>{movie.title}</BackLink>
      <Stepper current={2} />
      <div className="date-layout">
        <Poster className="date-layout__image" src={movie.poster} />
        <div>
          <p className="eyebrow">{movie.title}</p>
          <h1 className="h-display" style={{ marginTop: 24 }}>Когда идём в кино?</h1>
          <p className="lead" style={{ marginTop: 24 }}>Выберите дату, чтобы увидеть доступные сеансы.</p>
          <div className="date-chips" role="radiogroup" aria-label="Дата">
            {dates.map((key) => {
              const d = fromDateKey(key);
              const selected = key === date;
              return (
                <button key={key} type="button" role="radio" aria-checked={selected} className={`date-chip${selected ? ' date-chip--selected' : ''}`} onClick={() => setDate(key)}>
                  <span>{weekdayShort(d)}</span>
                  <strong>{dayMonthShort(d)}</strong>
                </button>
              );
            })}
          </div>
          <p className="lead">Выбрано: {fullDateWeekday(fromDateKey(date))}</p>
          <Button style={{ marginTop: 24, minWidth: 260 }} onClick={show}>Показать сеансы</Button>
        </div>
      </div>
      <section className="panel" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, lineHeight: '28px', fontWeight: 500 }}>Один фильм — несколько кинотеатров</h2>
        <p className="lead" style={{ marginTop: 8 }}>На следующем шаге можно сравнить время и стоимость сеансов.</p>
      </section>
    </div>
  );
}
