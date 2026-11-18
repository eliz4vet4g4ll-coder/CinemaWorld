import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';
import type { Id } from '../../api/types';
import { Button, ButtonLink } from '../../components/Button';
import { TextField } from '../../components/Field';
import { useAsync } from '../../hooks/useAsync';
import { AdminFormShell, type FieldErrors, LoadingRecord, SavedToast, useSaveFlow } from './shared';

const LIST = '/admin/cinemas';

/** Залы кинотеатра. В макете списка нет, но без него экран «Редактировать зал» не открыть. */
function HallsSection({ cinemaId }: { cinemaId: Id }) {
  const state = useAsync(api.admin.halls, []);
  const halls = state.data?.filter((h) => String(h.cinemaId) === String(cinemaId));
  const base = `${LIST}/${cinemaId}/halls`;

  return (
    <section className="hall-section">
      <h2 className="h-title">Залы</h2>
      {state.loading && <p className="lead" role="status">Загружаем залы…</p>}
      {state.error && (
        <div className="panel" role="alert">
          <p className="lead" style={{ marginBottom: 16 }}>Не удалось загрузить залы.</p>
          <Button onClick={state.reload}>Повторить</Button>
        </div>
      )}
      {halls && halls.length === 0 && <p className="lead">Залов пока нет. Без зала нельзя создать сеанс.</p>}
      {halls && halls.length > 0 && (
        <div className="table-wrap">
          <table className="table admin-table">
            <thead><tr><th>Зал</th><th>Категория</th><th>Мест</th><th>Рядов</th><th>Действие</th></tr></thead>
            <tbody>
              {halls.map((h) => (
                <tr key={h.id}>
                  <td className="table__strong">{h.name}</td>
                  <td>{h.category}</td>
                  <td>{h.seatCount}</td>
                  <td>{h.rowCount}</td>
                  <td>
                    {h.hasActiveSessions
                      ? <Button variant="secondary" disabled aria-label={`Зал ${h.name}: редактирование недоступно, есть сеансы`}>Редактировать</Button>
                      : <ButtonLink to={`${base}/${h.id}`} variant="secondary">Редактировать</ButtonLink>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {halls?.some((h) => h.hasActiveSessions) && <p className="text-muted" style={{ marginTop: 16 }}>Залы с идущими и предстоящими сеансами редактировать нельзя.</p>}
    </section>
  );
}

export function CinemaFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const flow = useSaveFlow(LIST);
  const list = useAsync(() => (isNew ? Promise.resolve([]) : api.admin.cinemas()), [id]);
  const record = list.data?.find((c) => String(c.id) === id);
  const [form, setForm] = useState({ name: '', address: '' });

  useEffect(() => {
    if (record) setForm({ name: record.name, address: record.address });
  }, [record]);

  if (!isNew && (list.loading || list.error || !record)) return <LoadingRecord state={list} notFound={!record} backTo={LIST} />;

  const validate = () => {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = 'Укажите название.';
    if (!form.address.trim()) e.address = 'Укажите адрес.';
    return e;
  };
  const send = () => {
    const body = { name: form.name.trim(), address: form.address.trim() };
    return isNew ? api.admin.createCinema(body) : api.admin.updateCinema(id, body);
  };

  return (
    <>
      <AdminFormShell
        flow={flow}
        title={isNew ? 'Добавить кинотеатр' : 'Редактировать кинотеатр'}
        backTo={LIST}
        backLabel="Кинотеатры"
        isNew={isNew}
        onSubmit={() => flow.save(validate, send)}
        extraAction={!isNew && <ButtonLink to={`${LIST}/${id}/halls/new`} variant="secondary" className="btn--muted">Добавить зал</ButtonLink>}
        after={!isNew && <HallsSection cinemaId={id} />}
      >
        <div className="admin-form__grid cinema-fields">
          <TextField label="Название *" placeholder="Название кинотеатра" value={form.name} error={flow.errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Адрес *" placeholder="Улица, дом" value={form.address} error={flow.errors.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </AdminFormShell>
      <SavedToast />
    </>
  );
}
