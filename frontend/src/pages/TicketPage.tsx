import { useParams } from 'react-router-dom';
import { api } from '../api';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Poster } from '../components/Poster';
import { useAsync } from '../hooks/useAsync';
import { duration, fullDateWeekday, price, time } from '../lib/format';

export function TicketPage() {
  const { id = '' } = useParams();
  const { data: ticket, loading, error, reload } = useAsync(() => api.ticket(id), [id]);

  if (loading) return <div className="container"><Loading /></div>;
  if (error || !ticket) {
    const missing = error?.status === 404 || error?.status === 403;
    return (
      <div className="container">
        <Feedback tone="error" title={missing ? 'Билет не найден' : 'Не удалось получить данные'} text={missing ? 'Проверьте список своих билетов.' : 'Повторите попытку.'}>
          {missing ? <ButtonLink to="/account">Мои билеты</ButtonLink> : <Button onClick={reload}>Повторить</Button>}
        </Feedback>
      </div>
    );
  }

  const { movie, session, seat } = ticket;
  return (
    <div className="container container--narrow">
      <p className="h-sub text-success" style={{ textTransform: 'uppercase' }}><span aria-hidden="true">✓</span>&nbsp; Билет оформлен</p>
      <h1 className="h-display" style={{ marginTop: 24 }}>Увидимся в кино</h1>
      <p className="lead" style={{ marginTop: 24 }}>Билет сохранён в вашем личном кабинете.</p>
      <section className="done-card">
        <Poster className="done-card__image" src={movie.poster} />
        <div>
          <h2 className="h-title">{movie.title}</h2>
          <p className="text-muted" style={{ marginTop: 16 }}>{[movie.ageRating, duration(movie.duration)].filter(Boolean).join(' · ')}</p>
          <dl className="summary__list">
            <div><dt>Фильм</dt><dd>{movie.title}</dd></div>
            <div><dt>Кинотеатр</dt><dd>{session.cinema.name}</dd></div>
            <div><dt>Дата</dt><dd>{fullDateWeekday(new Date(session.startsAt))}</dd></div>
            <div><dt>Время</dt><dd>{time(session.startsAt)}</dd></div>
            <div><dt>Место</dt><dd>Ряд {seat.row}, место {seat.number}</dd></div>
          </dl>
          <hr className="summary__divider" />
          <p className="text-success">Билет № {ticket.number} · Оформлен</p>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: '24px' }}>Стоимость: {price(session.ticketPrice)}</p>
        </div>
      </section>
      <div className="btn-row" style={{ marginTop: 24 }}>
        <ButtonLink to="/account" style={{ minWidth: 230 }}>Мои билеты</ButtonLink>
        <ButtonLink to="/catalog" variant="secondary" style={{ minWidth: 200 }}>В каталог</ButtonLink>
      </div>
    </div>
  );
}
