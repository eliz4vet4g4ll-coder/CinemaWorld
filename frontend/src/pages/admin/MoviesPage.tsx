import { useState } from 'react';
import { api } from '../../api';
import type { Movie } from '../../api/types';
import { ButtonLink } from '../../components/Button';
import { useAsync } from '../../hooks/useAsync';
import { plural } from '../../lib/format';
import { AdminList } from './shared';

export function MoviesPage() {
  const state = useAsync(api.admin.movies, []);
  const [search, setSearch] = useState('');
  const count = state.data?.length ?? 0;

  return (
    <AdminList<Movie>
      title="Фильмы"
      subtitle={`${count} ${plural(count, ['фильм', 'фильма', 'фильмов'])} в каталоге`}
      addLabel="+ Добавить фильм"
      addTo="/admin/movies/new"
      state={state}
      emptyTitle="Фильмов пока нет"
      emptyText="Добавьте первый фильм, чтобы он появился в каталоге."
      errorTitle="Не удалось загрузить фильмы"
    >
      {(movies) => {
        const list = movies.filter((m) => m.title.toLowerCase().includes(search.trim().toLowerCase()));
        return (
          <>
            <div className="field search-wrap admin-search">
              <label className="field__label" htmlFor="admin-search">Поиск по названию</label>
              <input id="admin-search" className="input search-input" placeholder="Найти фильм" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {list.length === 0 ? <p className="lead">По запросу «{search}» фильмы не найдены.</p> : (
              <div className="table-wrap">
                <table className="table admin-table">
                  <thead><tr><th>Название</th><th>Год</th><th>Длительность</th><th>Возраст</th><th>Действие</th></tr></thead>
                  <tbody>
                    {list.map((m) => (
                      <tr key={m.id}>
                        <td className="table__strong">{m.title}</td>
                        <td>{m.year ?? '—'}</td>
                        <td>{m.duration} мин</td>
                        <td>{m.ageRating}</td>
                        <td><ButtonLink to={`/admin/movies/${m.id}`} variant="secondary">Редактировать</ButtonLink></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      }}
    </AdminList>
  );
}
