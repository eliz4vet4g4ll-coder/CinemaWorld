import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Poster } from '../components/Poster';
import { useAsync } from '../hooks/useAsync';
import { dayMonth, initials, price, time } from '../lib/format';
import { useAuth } from '../state/auth';

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: tickets, loading, error, reload } = useAsync(api.myTickets, []);

  if (!user) return null;

  const head = (
    <>
      <p className="eyebrow">Личный кабинет</p>
      <h1 className="h-display" style={{ marginTop: 24 }}>Мои билеты</h1>
    </>
  );
  const short = <p className="lead" style={{ margin: '12px 0 24px' }}>{user.name} · {user.email}</p>;

  if (loading) return <div className="container">{head}{short}<Loading /></div>;
  if (error) {
    return (
      <div className="container">
        {head}{short}
        <Feedback tone="error" title="Не удалось получить данные" text="Не удалось загрузить билеты. Повторите попытку.">
          <Button onClick={reload}>Повторить</Button>
        </Feedback>
      </div>
    );
  }
  if (!tickets?.length) {
    return (
      <div className="container">
        {head}{short}
        <Feedback title="У вас пока нет билетов" text="Найдите фильм и оформите билет. История покупок пока пуста.">
          <ButtonLink to="/catalog">Перейти в каталог</ButtonLink>
        </Feedback>
      </div>
    );
  }

  const now = Date.now();
  const byStart = (a: typeof tickets[number], b: typeof tickets[number]) => +new Date(a.session.startsAt) - +new Date(b.session.startsAt);
  const upcoming = tickets.filter((t) => +new Date(t.session.startsAt) >= now).sort(byStart);
  const history = tickets.filter((t) => +new Date(t.session.startsAt) < now).sort(byStart).reverse();

  return (
    <div className="container">
      {head}
      <section className="profile" style={{ marginTop: 24 }}>
        <div className="avatar" aria-hidden="true">{initials(user.name)}</div>
        <div>
          <p className="h-title" style={{ fontWeight: 500 }}>{user.name}</p>
          <p className="lead" style={{ marginTop: 4 }}>{user.email}</p>
        </div>
        <Button variant="ghost" onClick={() => { logout(); navigate('/login'); }}>Выйти</Button>
      </section>

      <h2 className="h-title" style={{ margin: '24px 0' }}>Предстоящие сеансы</h2>
      {upcoming.length ? upcoming.map((t) => (
        <article className="my-ticket" key={t.id}>
          <Poster className="my-ticket__image" src={t.movie.poster} />
          <div>
            <h3 className="h-title">{t.movie.title}</h3>
            <p style={{ marginTop: 8, fontSize: 16, lineHeight: '24px' }}>{t.session.cinema.name}</p>
            <p className="lead" style={{ marginTop: 8 }}>
              {dayMonth(new Date(t.session.startsAt))} · {time(t.session.startsAt)} · Ряд {t.seat.row}, место {t.seat.number}
            </p>
            <p style={{ marginTop: 8 }}><span className="badge">Оформлен</span></p>
          </div>
          <ButtonLink to={`/tickets/${t.id}`}>Открыть билет</ButtonLink>
        </article>
      )) : <p className="lead">Предстоящих сеансов нет.</p>}

      <h2 className="h-title" style={{ margin: '24px 0' }}>История покупок</h2>
      {history.length ? (
        <>
          {history.map((t) => (
            <div className="history-row" key={t.id}>
              <Poster className="history-row__image" src={t.movie.poster} />
              <strong>{t.movie.title}</strong>
              <span>{t.session.cinema.name}</span>
              <span>{dayMonth(new Date(t.session.startsAt))} · {time(t.session.startsAt)}</span>
              <strong>{price(t.session.ticketPrice)}</strong>
            </div>
          ))}
          <p className="text-muted" style={{ marginTop: 24 }}>История содержит билеты на прошедшие сеансы.</p>
        </>
      ) : <p className="lead">История покупок пока пуста.</p>}
    </div>
  );
}
