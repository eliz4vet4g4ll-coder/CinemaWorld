import { useNavigate } from 'react-router-dom';
import type { Session } from '../api/types';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Stepper } from '../components/Stepper';
import { dayMonth, fromDateKey, price, time } from '../lib/format';
import { useBooking } from '../state/booking';
import { useSessionsData } from './useSessionsData';

export function ComparePage() {
  const { id, date, movie, sessions } = useSessionsData();
  const { update } = useBooking();
  const navigate = useNavigate();
  const sessionsUrl = `/movies/${id}/sessions?date=${date}`;

  const pick = (session: Session) => {
    update({ session, seat: null, attemptKey: null });
    navigate(`/sessions/${session.id}/seats`);
  };

  let body;
  if (sessions.loading || movie.loading) {
    body = <Loading />;
  } else if (sessions.error || movie.error) {
    body = (
      <Feedback tone="error" title="Не удалось получить данные" text="Расписание не загрузилось. Выбранные фильм и дата сохранены.">
        <Button onClick={() => { movie.reload(); sessions.reload(); }}>Повторить</Button>
      </Feedback>
    );
  } else if (!sessions.data?.length) {
    body = (
      <Feedback title="На эту дату сеансов нет" text="Выберите другую дату, чтобы посмотреть доступные сеансы.">
        <ButtonLink to={`/movies/${id}/dates`}>Выбрать другую дату</ButtonLink>
      </Feedback>
    );
  } else {
    body = (
      <div className="table-wrap">
        <table className="table table--compare">
          <thead>
            <tr><th>Кинотеатр</th><th>Адрес</th><th>Время</th><th>Цена</th><th><span className="sr-only">Действие</span></th></tr>
          </thead>
          <tbody>
            {sessions.data.map((s) => (
              <tr key={s.id}>
                <td className="table__strong">{s.cinema.name}</td>
                <td>{s.cinema.address}</td>
                <td className="table__light">{time(s.startsAt)}</td>
                <td><span className="table__price">{price(s.ticketPrice)}</span></td>
                <td><Button onClick={() => pick(s)}>Выбрать сеанс</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="container">
      <BackLink to={sessionsUrl}>Сеансы</BackLink>
      <Stepper current={4} />
      <div className="page-head" style={{ marginTop: 44 }}>
        <p className="eyebrow">{movie.data?.title} · {dayMonth(fromDateKey(date))}</p>
        <h1 className="h-display">Сравните и выберите сеанс</h1>
        <p className="lead">Кинотеатры на одну дату. Вся информация для выбора — в одной таблице.</p>
      </div>
      {body}
    </div>
  );
}
