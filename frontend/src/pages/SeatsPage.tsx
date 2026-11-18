import { Fragment, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Seat } from '../api/types';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Stepper } from '../components/Stepper';
import { useAsync } from '../hooks/useAsync';
import { dayMonth, fullDateWeekday, price, time } from '../lib/format';
import { useBooking } from '../state/booking';
import { BookingLost } from './bookingGuards';

export function SeatsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, update } = useBooking();
  const seats = useAsync(() => api.seats(id), [id]);
  const conflict = (location.state as { conflict?: boolean } | null)?.conflict;

  const { movie, session, seat: selected } = booking;
  const known = session && String(session.id) === id && movie;

  // Выбранное место могли занять, пока пользователь был на другом шаге.
  useEffect(() => {
    if (selected && seats.data?.some((s) => String(s.id) === String(selected.id) && s.occupied)) {
      update({ seat: null, attemptKey: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seats.data]);

  const rows = useMemo(() => {
    const map = new Map<number, Seat[]>();
    for (const s of seats.data ?? []) map.set(s.row, [...(map.get(s.row) ?? []), s]);
    return [...map.entries()].sort(([a], [b]) => a - b).map(([row, list]) => ({ row, seats: list.sort((a, b) => a.number - b.number) }));
  }, [seats.data]);
  const maxNumber = Math.max(0, ...(seats.data ?? []).map((s) => s.number));

  if (!known) return <BookingLost />;

  const start = new Date(session.startsAt);
  const toggle = (seat: Seat) => {
    update({ seat: String(selected?.id) === String(seat.id) ? null : seat, attemptKey: null });
  };

  return (
    <div className="container">
      {conflict && (
        <div className="alert" role="alert">
          <p className="alert__title">Место уже занято</p>
          <p className="alert__text">Выберите другое свободное место. Данные сеанса сохранены.</p>
        </div>
      )}
      <BackLink to={`/movies/${movie.id}/compare?date=${booking.date ?? ''}`}>Сравнение кинотеатров</BackLink>
      <Stepper current={5} />
      <div className="page-head" style={{ marginTop: 44 }}>
        <p className="eyebrow">{movie.title} · {dayMonth(start)} · {time(session.startsAt)}</p>
        <h1 className="h-display">Выберите место</h1>
        <p className="lead">{session.cinema.name} · {session.cinema.address}</p>
      </div>

      <div className="seat-layout">
        {seats.loading ? <Loading /> : seats.error ? (
          <Feedback tone="error" title="Не удалось получить данные" text="Схема зала не загрузилась. Данные сеанса сохранены.">
            <Button onClick={seats.reload}>Повторить</Button>
          </Feedback>
        ) : !rows.length ? (
          <Feedback title="Схема зала недоступна" text="Для этого сеанса пока нет мест. Выберите другой сеанс.">
            <Link className="btn btn--white" to={`/movies/${movie.id}/compare?date=${booking.date ?? ''}`}>К сравнению</Link>
          </Feedback>
        ) : (
          <section className="hall" aria-label="Схема зала">
            <div className="hall__screen">ЭКРАН</div>
            <div className="hall__grid" style={{ gridTemplateColumns: `40px repeat(${maxNumber}, 40px)` }}>
              <span className="hall__row-label">Ряд</span>
              {Array.from({ length: maxNumber }, (_, i) => <span key={i}>{i + 1}</span>)}
              {rows.map(({ row, seats: list }) => (
                <Fragment key={row}>
                  <span className="hall__row-label">{row}</span>
                  {Array.from({ length: maxNumber }, (_, i) => {
                    const seat = list.find((s) => s.number === i + 1);
                    if (!seat) return <span key={i} />;
                    const isSelected = String(selected?.id) === String(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={seat.occupied}
                        aria-pressed={isSelected}
                        aria-label={`Ряд ${seat.row}, место ${seat.number}${seat.occupied ? ', занято' : ''}`}
                        className={`seat${isSelected ? ' seat--selected' : ''}${seat.occupied ? ' seat--occupied' : ''}`}
                        onClick={() => toggle(seat)}
                      >
                        {seat.occupied ? '×' : isSelected ? '✓' : seat.number}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <ul className="seat-legend" aria-hidden="true">
              <li><span className="seat" style={{ display: 'grid', placeItems: 'center' }}>8</span> Свободно</li>
              <li><span className="seat seat--selected" style={{ display: 'grid', placeItems: 'center' }}>✓</span> Выбрано</li>
              <li><span className="seat seat--occupied" style={{ display: 'grid', placeItems: 'center' }}>×</span> Занято</li>
            </ul>
          </section>
        )}

        <aside className="summary">
          <h2 className="h-title">Ваш сеанс</h2>
          <dl className="summary__list">
            <div><dt>Фильм</dt><dd>{movie.title}</dd></div>
            <div><dt>Кинотеатр</dt><dd>{session.cinema.name}</dd></div>
            <div><dt>Дата</dt><dd>{fullDateWeekday(start)}</dd></div>
            <div><dt>Время</dt><dd>{time(session.startsAt)}</dd></div>
          </dl>
          <hr className="summary__divider" />
          {selected ? (
            <>
              <p className="h-sub">Ряд {selected.row}, место {selected.number}</p>
              <div className="summary__total">
                <span>1 билет</span>
                <span className="summary__price">{price(session.ticketPrice)}</span>
              </div>
              <Button variant="primary" wide onClick={() => navigate('/checkout')}>Продолжить</Button>
            </>
          ) : (
            <>
              <p className="lead" style={{ marginBottom: 16 }}>Выберите место на схеме</p>
              <Button variant="primary" wide disabled>Выберите место</Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
