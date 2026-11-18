import { type ChangeEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { SelectField, TextField } from '../../components/Field';
import { useAsync } from '../../hooks/useAsync';
import { time } from '../../lib/format';
import { parseDateTime } from './parseDateTime';
import { AdminFormShell, type FieldErrors, LoadingRecord, useSaveFlow } from './shared';

const LIST = '/admin/sessions';

export function SessionFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const flow = useSaveFlow(LIST);

  const data = useAsync(async () => {
    const [movies, cinemas, halls, sessions] = await Promise.all([api.admin.movies(), api.admin.cinemas(), api.admin.halls(), isNew ? Promise.resolve([]) : api.admin.sessions()]);
    return { movies, cinemas, halls, sessions };
  }, [id]);

  const record = data.data?.sessions.find((s) => String(s.id) === id);
  const [form, setForm] = useState({ movieId: '', cinemaId: '', hallId: '', date: '', time: '', price: '' });

  useEffect(() => {
    if (!record) return;
    setForm({
      movieId: String(record.movieId), cinemaId: String(record.cinemaId), hallId: String(record.hallId),
      date: new Intl.DateTimeFormat('ru-RU').format(new Date(record.startsAt)),
      time: time(record.startsAt), price: String(record.ticketPrice),
    });
  }, [record]);

  if (data.loading || data.error || !data.data || (!isNew && !record)) {
    return <LoadingRecord state={data} notFound={!isNew && !record} backTo={LIST} />;
  }

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  // Зал всегда относится к выбранному кинотеатру, поэтому при смене кинотеатра выбор зала сбрасывается.
  const halls = data.data.halls.filter((h) => String(h.cinemaId) === form.cinemaId);
  const noHalls = !!form.cinemaId && halls.length === 0;

  const validate = () => {
    const e: FieldErrors = {};
    if (!form.movieId) e.movieId = 'Выберите фильм.';
    if (!form.cinemaId) e.cinemaId = 'Выберите кинотеатр.';
    if (!form.hallId) e.hallId = 'Выберите зал.';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(form.date.trim()) || !parseDateTime(form.date, '00:00')) e.startsAtDate = 'Укажите дату в формате ДД.ММ.ГГГГ.';
    if (!parseDateTime('01.01.2000', form.time)) e.startsAtTime = 'Укажите время в формате ЧЧ:ММ.';
    if (!(Number(form.price.replace(',', '.')) > 0)) e.ticketPrice = 'Стоимость должна быть больше 0 ₽.';
    return e;
  };

  const send = () => {
    const body = {
      // Значения id берём из исходных списков, чтобы сохранить их тип (число или строка).
      movieId: data.data!.movies.find((m) => String(m.id) === form.movieId)!.id,
      cinemaId: data.data!.cinemas.find((c) => String(c.id) === form.cinemaId)!.id,
      hallId: data.data!.halls.find((h) => String(h.id) === form.hallId)!.id,
      startsAt: parseDateTime(form.date, form.time)!.toISOString(),
      ticketPrice: Number(form.price.replace(',', '.')),
    };
    return isNew ? api.admin.createSession(body) : api.admin.updateSession(id, body);
  };

  return (
    <AdminFormShell
      flow={flow}
      title={isNew ? 'Добавить сеанс' : 'Редактировать сеанс'}
      backTo={LIST}
      backLabel="Сеансы"
      isNew={isNew}
      onSubmit={() => flow.save(validate, send)}
    >
      <div className="admin-form__grid">
        <div className="cols-3 cols-3--session">
          <SelectField label="Фильм *" value={form.movieId} error={flow.errors.movieId} onChange={set('movieId')}>
            <option value="">Выбрать фильм</option>
            {data.data.movies.map((m) => <option key={m.id} value={String(m.id)}>{m.title}</option>)}
          </SelectField>
          <SelectField label="Кинотеатр *" value={form.cinemaId} error={flow.errors.cinemaId} onChange={(e) => setForm({ ...form, cinemaId: e.target.value, hallId: '' })}>
            <option value="">Выбрать кинотеатр</option>
            {data.data.cinemas.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </SelectField>
          <SelectField
            label="Зал *"
            value={form.hallId}
            disabled={!form.cinemaId || noHalls}
            error={flow.errors.hallId}
            hint={noHalls ? <>У кинотеатра нет залов. <Link className="text-link" to={`/admin/cinemas/${form.cinemaId}/halls/new`}>Добавить зал</Link></> : undefined}
            onChange={set('hallId')}
          >
            <option value="">Выбрать зал</option>
            {halls.map((h) => <option key={h.id} value={String(h.id)}>{h.name}</option>)}
          </SelectField>
        </div>
        <div className="cols-3">
          <TextField label="Дата *" placeholder="ДД.ММ.ГГГГ" value={form.date} error={flow.errors.startsAtDate ?? flow.errors.startsAt} onChange={set('date')} />
          <TextField label="Время *" placeholder="ЧЧ:ММ" value={form.time} error={flow.errors.startsAtTime} onChange={set('time')} />
          <TextField label="Стоимость билета, ₽ *" inputMode="decimal" placeholder="Цена" value={form.price} error={flow.errors.ticketPrice} onChange={set('price')} />
        </div>
        {isNew && <p className="text-muted">Стоимость применяется к каждому месту этого сеанса.</p>}
      </div>
    </AdminFormShell>
  );
}
