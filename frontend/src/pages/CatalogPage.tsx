import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { MovieCard } from '../components/MovieCard';
import { useAsync } from '../hooks/useAsync';
import { genres, plural } from '../lib/format';

const FILM = ['фильм', 'фильма', 'фильмов'] as [string, string, string];

export function CatalogPage() {
  const { data: movies, loading, error, reload } = useAsync(api.movies, []);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const query = params.get('q')?.trim() ?? '';
  const genre = params.get('genre') ?? '';
  const year = params.get('year') ?? '';
  const [draft, setDraft] = useState(query);
  const [editing, setEditing] = useState(false);

  useEffect(() => setDraft(query), [query]);
  const focusSearch = (location.state as { focusSearch?: boolean } | null)?.focusSearch;
  useEffect(() => {
    if ((focusSearch || editing) && !loading) inputRef.current?.focus();
  }, [focusSearch, editing, loading, location.key]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const allGenres = useMemo(() => [...new Set((movies ?? []).flatMap((m) => genres(m.genre)))].sort(), [movies]);
  const allYears = useMemo(() => [...new Set((movies ?? []).map((m) => m.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [movies]);

  const results = useMemo(() => (movies ?? []).filter((m) => {
    const needle = query.toLowerCase();
    return (!needle || m.title.toLowerCase().includes(needle) || m.genre.toLowerCase().includes(needle))
      && (!genre || genres(m.genre).includes(genre))
      && (!year || String(m.year) === year);
  }), [movies, query, genre, year]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setEditing(false);
    setParam('q', draft.trim());
  };

  const searching = !!query;
  const head = (
    <>
      {searching && <div style={{ marginBottom: 24 }}><BackLink to="/catalog">Каталог</BackLink></div>}
      <p className="eyebrow">{searching ? 'Поиск' : 'Каталог'}</p>
      <h1 className="h-display" style={{ marginTop: 16 }}>{searching ? 'Результаты поиска' : 'Фильмы'}</h1>
    </>
  );

  if (loading) return <div className="container">{head}<div style={{ marginTop: 24 }}><Loading /></div></div>;
  if (error) {
    return (
      <div className="container">
        {head}
        <div style={{ marginTop: 24 }}>
          <Feedback tone="error" title="Не удалось получить данные" text="Фильмы не загрузились. Повторите попытку.">
            <Button onClick={reload}>Повторить</Button>
          </Feedback>
        </div>
      </div>
    );
  }
  if (!movies?.length) {
    return (
      <div className="container">
        {head}
        <div style={{ marginTop: 24 }}>
          <Feedback title="Данные пока отсутствуют" text="Фильмы появятся здесь после добавления в каталог.">
            <ButtonLink to="/">На главную</ButtonLink>
          </Feedback>
        </div>
      </div>
    );
  }

  const nothing = results.length === 0;
  const hideForm = searching && nothing && !editing;

  return (
    <div className="container">
      {head}
      {!searching && <p className="lead" style={{ marginTop: 16 }}>Найдите фильм и сравните сеансы в разных кинотеатрах.</p>}

      {!hideForm && (
        <form className="search-form" role="search" onSubmit={submit}>
          <div className="field search-wrap">
            <label className="field__label" htmlFor="catalog-search">Поиск</label>
            <input
              ref={inputRef}
              id="catalog-search"
              className="input search-input"
              placeholder="Название фильма"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <Button type="submit" style={{ marginTop: 28 }}>Найти</Button>
        </form>
      )}

      {searching && !hideForm && <p style={{ marginTop: 24 }}><Link className="link" to="/catalog">Очистить поиск</Link></p>}

      {!searching && (
        <div className="filters">
          <select className="chip-select" aria-label="Жанр" value={genre} onChange={(e) => setParam('genre', e.target.value)}>
            <option value="">Все жанры</option>
            {allGenres.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select className="chip-select" aria-label="Год" value={year} onChange={(e) => setParam('year', e.target.value)}>
            <option value="">Все годы</option>
            {allYears.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      )}

      {nothing ? (
        hideForm ? (
          <div style={{ marginTop: 24 }}>
            <Feedback title="Ничего не найдено" text={`По запросу «${query}» фильмы не найдены. Попробуйте другое название.`}>
              <Button onClick={() => setEditing(true)}>Изменить запрос</Button>
            </Feedback>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <Feedback title="Ничего не найдено" text="Попробуйте изменить условия поиска или сбросить фильтры." />
          </div>
        )
      ) : (
        <>
          <p className="text-muted" style={{ margin: searching ? '24px 0' : '0 0 16px' }}>
            {searching
              ? `${plural(results.length, ['Найден', 'Найдено', 'Найдено'])} ${results.length} ${plural(results.length, FILM)}`
              : `В кино · ${results.length} ${plural(results.length, FILM)}`}
          </p>
          <div className="movie-grid">
            {results.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </>
      )}
    </div>
  );
}
