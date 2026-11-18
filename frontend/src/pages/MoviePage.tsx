import { useParams } from 'react-router-dom';
import { api } from '../api';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Hero } from '../components/Hero';
import { useAsync } from '../hooks/useAsync';

export function MoviePage() {
  const { id = '' } = useParams();
  const { data: movie, loading, error, reload } = useAsync(() => api.movie(id), [id]);

  if (loading) return <div className="container"><Loading /></div>;
  if (error || !movie) {
    const missing = error?.status === 404;
    return (
      <div className="container">
        <Feedback tone="error" title={missing ? 'Фильм не найден' : 'Не удалось получить данные'} text={missing ? 'Возможно, он больше не идёт в кино.' : 'Повторите попытку.'}>
          {missing ? <ButtonLink to="/catalog">В каталог</ButtonLink> : <Button onClick={reload}>Повторить</Button>}
        </Feedback>
      </div>
    );
  }

  return (
    <>
      <Hero movie={movie} tall eyebrow="Фильм / В кино" text={movie.tagline ?? movie.description}>
        <ButtonLink to={`/movies/${movie.id}/dates`}>Выбрать дату</ButtonLink>
      </Hero>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 452px)', gap: 40, alignItems: 'start' }}>
        <div>
          <h2 className="h-title">О фильме</h2>
          <p className="lead" style={{ marginTop: 16, maxWidth: 760 }}>{movie.description}</p>
          <div style={{ marginTop: 24 }}><BackLink to="/catalog">Вернуться в каталог</BackLink></div>
        </div>
        <ul className="text-muted" style={{ display: 'grid', gap: 12 }}>
          {movie.director && <li>Режиссёр: {movie.director}</li>}
          {movie.cast && <li>В ролях: {movie.cast}</li>}
          {movie.genre && <li>Жанр: {movie.genre}</li>}
        </ul>
      </div>
    </>
  );
}
