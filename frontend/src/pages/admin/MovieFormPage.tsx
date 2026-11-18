import { type ChangeEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';
import type { MovieInput } from '../../api/types';
import { Button } from '../../components/Button';
import { SelectField, TextArea, TextField } from '../../components/Field';
import { useAsync } from '../../hooks/useAsync';
import { AdminFormShell, type FieldErrors, LoadingRecord, useSaveFlow } from './shared';

const LIST = '/admin/movies';
const AGE_RATINGS = ['0+', '6+', '12+', '16+', '18+'];
const GENRES = ['фантастика', 'драма', 'комедия', 'боевик', 'триллер', 'приключения', 'мелодрама', 'ужасы', 'мультфильм', 'документальный'];
const MAX_POSTER_BYTES = 2 * 1024 * 1024;

export function MovieFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const flow = useSaveFlow(LIST);
  const list = useAsync(() => (isNew ? Promise.resolve([]) : api.admin.movies()), [id]);
  const record = list.data?.find((m) => String(m.id) === id);

  const [form, setForm] = useState({ title: '', duration: '', ageRating: '', year: '', genre: '', director: '', cast: '', description: '', poster: '' });
  const [posterError, setPosterError] = useState('');

  useEffect(() => {
    if (!record) return;
    setForm({
      title: record.title, duration: String(record.duration), ageRating: record.ageRating, year: record.year ? String(record.year) : '',
      genre: record.genre, director: record.director, cast: record.cast, description: record.description, poster: record.poster,
    });
  }, [record]);

  if (!isNew && (list.loading || list.error || !record)) return <LoadingRecord state={list} notFound={!record} backTo={LIST} />;

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  const pickPoster = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setPosterError('Подойдёт файл JPG или PNG.');
    if (file.size > MAX_POSTER_BYTES) return setPosterError('Файл должен быть не больше 2 МБ.');
    setPosterError('');
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, poster: String(reader.result) }));
    reader.onerror = () => setPosterError('Не удалось прочитать файл.');
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: FieldErrors = {};
    if (!form.title.trim()) e.title = 'Укажите название.';
    if (!(Number.isInteger(Number(form.duration)) && Number(form.duration) > 0)) e.duration = 'Укажите длительность в минутах.';
    if (!form.ageRating) e.ageRating = 'Выберите ограничение.';
    if (form.year && !(Number.isInteger(Number(form.year)) && Number(form.year) >= 1888 && Number(form.year) <= new Date().getFullYear() + 5)) e.year = 'Укажите корректный год.';
    if (!form.genre) e.genre = 'Выберите жанр.';
    if (!form.description.trim()) e.description = 'Добавьте описание.';
    return e;
  };

  const send = () => {
    const body: MovieInput = {
      title: form.title.trim(), duration: Number(form.duration), ageRating: form.ageRating, year: form.year ? Number(form.year) : null,
      genre: form.genre, director: form.director.trim(), cast: form.cast.trim(), description: form.description.trim(), poster: form.poster,
    };
    return isNew ? api.admin.createMovie(body) : api.admin.updateMovie(id, body);
  };

  const genreOptions = form.genre && !GENRES.includes(form.genre) ? [form.genre, ...GENRES] : GENRES;

  return (
    <AdminFormShell
      flow={flow}
      title={isNew ? 'Добавить фильм' : 'Редактировать фильм'}
      backTo={LIST}
      backLabel="Фильмы"
      isNew={isNew}
      onSubmit={() => flow.save(validate, send)}
    >
      <div className="movie-form">
        <div className="admin-form__grid">
          <TextField label="Название *" placeholder="Название фильма" value={form.title} error={flow.errors.title} onChange={set('title')} />
          <div className="cols-2">
            <TextField label="Длительность, мин *" inputMode="numeric" placeholder="Продолжительность" value={form.duration} error={flow.errors.duration} onChange={set('duration')} />
            <SelectField label="Возрастное ограничение *" value={form.ageRating} error={flow.errors.ageRating} onChange={set('ageRating')}>
              <option value="">Выбрать</option>
              {AGE_RATINGS.map((a) => <option key={a}>{a}</option>)}
            </SelectField>
          </div>
          <TextField label="Год выпуска" inputMode="numeric" placeholder="Год" value={form.year} error={flow.errors.year} onChange={set('year')} />
          <div className="cols-2">
            <SelectField label="Жанр *" value={form.genre} error={flow.errors.genre} onChange={set('genre')}>
              <option value="">Выбрать жанр</option>
              {genreOptions.map((g) => <option key={g}>{g}</option>)}
            </SelectField>
            <TextField label="Режиссёр" placeholder="Имя режиссёра" value={form.director} onChange={set('director')} />
          </div>
          <TextField label="В ролях" placeholder="Основные актёры" value={form.cast} onChange={set('cast')} />
          <TextArea label="Описание *" placeholder="Краткое описание фильма" value={form.description} error={flow.errors.description} onChange={set('description')} />
        </div>
        <div>
          <p className="field__label">Постер</p>
          {form.poster ? <img className="poster-box" src={form.poster} alt="Постер фильма" /> : <div className="poster-box" />}
          <label className="btn btn--secondary file-btn">
            Загрузить постер
            <input type="file" accept="image/jpeg,image/png" onChange={pickPoster} />
          </label>
          <p className={posterError ? 'field__error' : 'field__hint'}>{posterError || 'JPG или PNG'}</p>
          {form.poster && <Button variant="ghost" wide style={{ marginTop: 8 }} onClick={() => setForm({ ...form, poster: '' })}>Убрать постер</Button>}
        </div>
      </div>
    </AdminFormShell>
  );
}
