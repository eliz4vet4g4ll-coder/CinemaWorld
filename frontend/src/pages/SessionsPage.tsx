import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Session } from '../api/types';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Stepper } from '../components/Stepper';
import { dayMonth, fromDateKey, fullDate, price, time, weekdayFullDate } from '../lib/format';
import { useBooking } from '../state/booking';
import { useSessionsData } from './useSessionsData';

export function SessionsPage() {
  const { id, date, movie, sessions } = useSessionsData();
  const { update } = useBooking();
  const navigate = useNavigate();
  const day = fromDateKey(date);
  const datesUrl = `/movies/${id}/dates`;

  const byCinema = useMemo(() => {
    const groups = new Map<string, Session[]>();
    for (const s of sessions.data ?? []) {
      const key = String(s.cinema.id);
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    return [...groups.values()];
  }, [sessions.data]);

  const pick = (session: Session) => {
    update({ session, seat: null, attemptKey: null });
    navigate(`/sessions/${session.id}/seats`);
  };

  const title = <h1 className="h-display" style={{ marginTop: 24 }}>Сеансы на {dayMonth(day)}</h1>;
  const subtitle = <p className="title-row__meta">{movie.data?.title} · {fullDate(day)}</p>;

  if (sessions.loading || movie.loading) {
    return <div className="container"><p className="eyebrow">Сеансы</p>{title}<div style={{ marginTop: 24 }}><Loading /></div></div>;
  }
  if (sessions.error || movie.error) {
    return (
      <div className="container">
        <p className="eyebrow">Сеансы</p>{title}{subtitle}
        <div style={{ marginTop: 24 }}>
          <Feedback tone="error" title="Не удалось получить данные" text="Расписание не загрузилось. Выбранные фильм и дата сохранены.">
            <Button onClick={() => { movie.reload(); sessions.reload(); }}>Повторить</Button>
          </Feedback>
        </div>
      </div>
    );
  }
  if (!byCinema.length) {
    return (
      <div className="container">
        <p className="eyebrow">Сеансы</p>{title}{subtitle}
        <div style={{ marginTop: 24 }}>
          <Feedback title="На эту дату сеансов нет" text="Выберите другую дату, чтобы посмотреть доступные сеансы.">
            <ButtonLink to={datesUrl}>Выбрать другую дату</ButtonLink>
          </Feedback>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <BackLink to={datesUrl}>Выбор даты</BackLink>
      <Stepper current={3} />
      <div className="title-row">
        <div>
          <p className="eyebrow">{movie.data?.title}</p>
          <h1 className="h-display" style={{ marginTop: 8 }}>Сеансы на {dayMonth(day)}</h1>
          <p className="title-row__meta">
            {weekdayFullDate(day)}&nbsp; ·&nbsp; <Link to={datesUrl} className="link">Изменить дату</Link>
          </p>
        </div>
        <ButtonLink to={`/movies/${id}/compare?date=${date}`}>Сравнить кинотеатры</ButtonLink>
      </div>
      <div className="cinema-list">
        {byCinema.map((group) => (
          <section className="cinema-row" key={group[0].cinema.id}>
            <div>
              <h2 className="h-title">{group[0].cinema.name}</h2>
              <p className="cinema-row__address">{group[0].cinema.address}</p>
            </div>
            <div className="session-chips">
              {group.map((s) => (
                <button key={s.id} type="button" className="session-chip" onClick={() => pick(s)}>
                  <strong>{time(s.startsAt)}</strong>
                  <span>{price(s.ticketPrice)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="text-muted" style={{ marginTop: 24 }}>Стоимость указана за одно место. Выберите время или откройте сравнение.</p>
    </div>
  );
}
