import { type ChangeEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';
import { BackLink } from '../../components/BackLink';
import { ButtonLink } from '../../components/Button';
import { Feedback } from '../../components/Feedback';
import { SelectField, TextField } from '../../components/Field';
import { useAsync } from '../../hooks/useAsync';
import { AdminFormShell, type FieldErrors, LoadingRecord, useSaveFlow } from './shared';

const CATEGORIES = ['2D', '3D', 'IMAX'];
const isPositiveInt = (value: string) => /^\d+$/.test(value.trim()) && Number(value) > 0;

export function HallFormPage() {
  const { cinemaId = '', id } = useParams();
  const isNew = !id;
  const cinemaPath = `/admin/cinemas/${cinemaId}`;
  const flow = useSaveFlow(cinemaPath);

  // Кинотеатр загружаем всегда: так адрес с несуществующим кинотеатром покажет понятное сообщение.
  const data = useAsync(async () => {
    const [cinemas, halls] = await Promise.all([api.admin.cinemas(), api.admin.halls()]);
    return { cinema: cinemas.find((c) => String(c.id) === cinemaId), halls };
  }, [cinemaId]);
  const record = data.data?.halls.find((h) => String(h.id) === id && String(h.cinemaId) === cinemaId);

  const [form, setForm] = useState({ name: '', category: '', seatCount: '', rowCount: '' });

  useEffect(() => {
    if (record) setForm({ name: record.name, category: record.category, seatCount: String(record.seatCount), rowCount: String(record.rowCount) });
  }, [record]);

  const missing = !data.data?.cinema || (!isNew && !record);
  if (data.loading || data.error || missing) return <LoadingRecord state={data} notFound={missing} backTo="/admin/cinemas" />;

  if (record?.hasActiveSessions) {
    return (
      <>
        <BackLink to={cinemaPath}>Кинотеатр</BackLink>
        <p className="eyebrow" style={{ marginTop: 24 }}>Администратор</p>
        <h1 className="h-display" style={{ margin: '24px 0' }}>Редактировать зал</h1>
        <Feedback title="Зал нельзя редактировать" text="В этом зале есть идущие или предстоящие сеансы. Редактирование станет доступно, когда они закончатся.">
          <ButtonLink to={cinemaPath}>К кинотеатру</ButtonLink>
        </Feedback>
      </>
    );
  }

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = 'Укажите название или номер зала.';
    if (!form.category) e.category = 'Выберите категорию.';
    if (!isPositiveInt(form.seatCount)) e.seatCount = 'Укажите количество мест.';
    if (!isPositiveInt(form.rowCount)) e.rowCount = 'Укажите количество рядов.';
    // Схема зала строится по рядам одинаковой длины, поэтому остаток недопустим.
    if (!e.seatCount && !e.rowCount && Number(form.seatCount) % Number(form.rowCount) !== 0) {
      e.seatCount = 'Места должны поровну делиться на ряды.';
    }
    return e;
  };

  const send = () => {
    const body = { name: form.name.trim(), category: form.category, seatCount: Number(form.seatCount), rowCount: Number(form.rowCount) };
    return isNew
      ? api.admin.createHall({ ...body, cinemaId: data.data!.cinema!.id })
      : api.admin.updateHall(id, body);
  };

  const options = form.category && !CATEGORIES.includes(form.category) ? [form.category, ...CATEGORIES] : CATEGORIES;

  return (
    <AdminFormShell
      flow={flow}
      title={isNew ? 'Добавить зал' : 'Редактировать зал'}
      backTo="/admin/cinemas"
      backLabel="Кинотеатры"
      cancelTo={cinemaPath}
      isNew={isNew}
      onSubmit={() => flow.save(validate, send)}
    >
      <div className="admin-form__grid">
        <div className="cols-2">
          <TextField label="Название/номер зала *" placeholder="№" value={form.name} error={flow.errors.name} onChange={set('name')} />
          <SelectField label="Категория *" value={form.category} error={flow.errors.category} onChange={set('category')}>
            <option value="">Выбрать категорию</option>
            {options.map((c) => <option key={c}>{c}</option>)}
          </SelectField>
        </div>
        <div className="cols-3">
          <TextField label="Кол-во мест *" inputMode="numeric" placeholder="N" value={form.seatCount} error={flow.errors.seatCount} onChange={set('seatCount')} />
          <TextField label="Кол-во рядов *" inputMode="numeric" placeholder="N" value={form.rowCount} error={flow.errors.rowCount} onChange={set('rowCount')} />
        </div>
      </div>
    </AdminFormShell>
  );
}
