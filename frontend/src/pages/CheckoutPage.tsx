import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ApiError } from '../api/client';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Poster } from '../components/Poster';
import { Stepper } from '../components/Stepper';
import { duration, fullDate, price, randomKey, time } from '../lib/format';
import { useAuth } from '../state/auth';
import { useBooking } from '../state/booking';
import { BookingLost } from './bookingGuards';

export function CheckoutPage() {
  const { booking, update, reset } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const { movie, session, seat } = booking;
  if (!movie || !session || !seat) return <BookingLost />;

  const seatsUrl = `/sessions/${session.id}/seats`;

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setFailed(false);
    // Ключ сохраняем до отправки: при обрыве связи повтор не создаст второй билет.
    const key = booking.attemptKey ?? randomKey();
    update({ attemptKey: key });
    try {
      const ticket = await api.createTicket(session.id, seat.id, key);
      navigate(`/tickets/${ticket.id}`, { replace: true, state: { justIssued: true } });
      reset();
    } catch (e) {
      setSending(false);
      if (e instanceof ApiError && e.status === 409) {
        update({ seat: null, attemptKey: null });
        navigate(seatsUrl, { replace: true, state: { conflict: true } });
      } else {
        setFailed(true);
      }
    }
  };

  const start = new Date(session.startsAt);
  return (
    <div className="container">
      <BackLink to={seatsUrl}>Выбор места</BackLink>
      <Stepper current={6} />
      <div className="page-head" style={{ marginTop: 44 }}>
        <p className="eyebrow">Оформление</p>
        <h1 className="h-display">Проверьте ваш билет</h1>
      </div>
      <div className="checkout">
        <section className="ticket-card">
          <div className="ticket-card__head">
            <Poster className="ticket-card__image" src={movie.poster} />
            <div>
              <h2 className="h-title">{movie.title}</h2>
              <p className="text-muted" style={{ marginTop: 8 }}>{[movie.year, movie.ageRating, duration(movie.duration)].filter(Boolean).join(' · ')}</p>
              <p style={{ marginTop: 16, fontSize: 20, lineHeight: '28px', fontWeight: 500 }}>{session.cinema.name}</p>
              <p className="text-muted" style={{ marginTop: 8 }}>{session.cinema.address}</p>
            </div>
          </div>
          <dl className="ticket-facts">
            <div className="fact"><dt>Дата</dt><dd>{fullDate(start)}</dd></div>
            <div className="fact"><dt>Время</dt><dd>{time(session.startsAt)}</dd></div>
            <div className="fact"><dt>Место</dt><dd>Ряд {seat.row}, место {seat.number}</dd></div>
          </dl>
          <p className="text-muted" style={{ marginTop: 24 }}>Пользователь</p>
          <p className="lead" style={{ marginTop: 16, color: '#fff' }}>{user?.name} · {user?.email}</p>
        </section>
        <aside className="panel">
          <h2 className="h-title">Итого</h2>
          <p className="lead" style={{ marginTop: 24 }}>1 билет</p>
          <p className="total-price">{price(session.ticketPrice)}</p>
          <Button variant="primary" wide loading={sending} onClick={submit}>
            {sending ? 'Оформляем…' : failed ? 'Повторить' : 'Оформить билет'}
          </Button>
          <p className="text-muted" style={{ marginTop: 24 }}>После подтверждения билет появится в личном кабинете.</p>
          {failed && <p className="text-danger" role="alert" style={{ marginTop: 16 }}>Не удалось оформить билет. Все данные сохранены.</p>}
        </aside>
      </div>
    </div>
  );
}
