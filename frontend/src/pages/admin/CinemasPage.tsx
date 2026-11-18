import { api } from '../../api';
import type { Cinema } from '../../api/types';
import { ButtonLink } from '../../components/Button';
import { useAsync } from '../../hooks/useAsync';
import { plural } from '../../lib/format';
import { AdminList } from './shared';

export function CinemasPage() {
  const state = useAsync(api.admin.cinemas, []);
  const count = state.data?.length ?? 0;
  return (
    <AdminList<Cinema>
      title="Кинотеатры"
      subtitle={`${count} ${plural(count, ['кинотеатр', 'кинотеатра', 'кинотеатров'])}`}
      addLabel="+ Добавить кинотеатр"
      addTo="/admin/cinemas/new"
      state={state}
      emptyTitle="Кинотеатров пока нет"
      emptyText="Добавьте первый кинотеатр, чтобы создавать сеансы."
      errorTitle="Не удалось загрузить кинотеатры"
    >
      {(cinemas) => (
        <div className="table-wrap">
          <table className="table admin-table">
            <thead><tr><th>Название</th><th>Адрес</th><th>Действие</th></tr></thead>
            <tbody>
              {cinemas.map((c) => (
                <tr key={c.id}>
                  <td className="table__strong">{c.name}</td>
                  <td>{c.address}</td>
                  <td><ButtonLink to={`/admin/cinemas/${c.id}`} variant="secondary">Редактировать</ButtonLink></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminList>
  );
}
