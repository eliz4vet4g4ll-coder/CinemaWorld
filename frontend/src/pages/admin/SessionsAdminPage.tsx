import { api } from '../../api';
import type { AdminSession } from '../../api/types';
import { ButtonLink } from '../../components/Button';
import { useAsync } from '../../hooks/useAsync';
import { price, time } from '../../lib/format';
import { AdminList } from './shared';

const numericDate = (iso: string) => new Intl.DateTimeFormat('ru-RU').format(new Date(iso));

export function SessionsAdminPage() {
  const state = useAsync(api.admin.sessions, []);
  return (
    <AdminList<AdminSession>
      title="Сеансы"
      subtitle="Управляйте расписанием и стоимостью билетов."
      addLabel="+ Добавить сеанс"
      addTo="/admin/sessions/new"
      state={state}
      emptyTitle="Сеансов пока нет"
      emptyText="Добавьте первый сеанс, чтобы он появился в расписании."
      errorTitle="Не удалось загрузить сеансы"
    >
      {(sessions) => (
        <>
          <div className="table-wrap">
            <table className="table admin-table">
              <thead><tr><th>Фильм</th><th>Кинотеатр</th><th>Дата и время</th><th>Цена</th><th>Действие</th></tr></thead>
              <tbody>
                {[...sessions].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)).map((s) => (
                  <tr key={s.id}>
                    <td className="table__strong">{s.movieTitle}</td>
                    <td>{s.cinema.name}</td>
                    <td>{numericDate(s.startsAt)} · {time(s.startsAt)}</td>
                    <td>{price(s.ticketPrice)}</td>
                    <td><ButtonLink to={`/admin/sessions/${s.id}`} variant="secondary">Редактировать</ButtonLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted" style={{ marginTop: 24 }}>Чтобы изменить цену, откройте редактирование сеанса.</p>
        </>
      )}
    </AdminList>
  );
}
