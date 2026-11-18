import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button, ButtonLink } from '../components/Button';
import { Feedback, Loading } from '../components/Feedback';
import { Hero } from '../components/Hero';
import { MovieCard } from '../components/MovieCard';
import { useAsync } from '../hooks/useAsync';

export function HomePage() {
  const { data: movies, loading, error, reload } = useAsync(api.movies, []);

  if (loading) return <div className="container"><Loading /></div>;
  if (error) {
    return (
      <div className="container">
        <Feedback tone="error" title="Не удалось получить данные" text="Фильмы не загрузились. Повторите попытку.">
          <Button onClick={reload}>Повторить</Button>
        </Feedback>
      </div>
    );
  }
  if (!movies?.length) {
    return (
      <div className="container">
        <Feedback title="Данные пока отсутствуют" text="Фильмы появятся здесь после добавления в каталог." />
      </div>
    );
  }

  const featured = movies[0];
  return (
    <>
      <Hero movie={featured} eyebrow={"C W\u00A0 /\u00A0 Большое кино"} text={featured.tagline ?? featured.description}>
        <ButtonLink to={`/movies/${featured.id}`}><span aria-hidden="true">▸</span> Выбрать сеанс</ButtonLink>
        <ButtonLink to={`/movies/${featured.id}`} variant="secondary"><span aria-hidden="true">ⓘ</span> О фильме</ButtonLink>
      </Hero>
      <div className="container" style={{ paddingTop: 20 }}>
        <div className="section-head">
          <h2 className="h-title">Сейчас в кино</h2>
          <Link to="/catalog" className="link">Весь каталог&nbsp; ›</Link>
        </div>
        <div className="movie-grid movie-grid--four">
          {movies.slice(0, 4).map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
        <div className="link-arrows">
          <Link to="/catalog" className="link">Найти фильм&nbsp; →</Link>
          <Link to="/account" className="link">Мои билеты&nbsp; →</Link>
        </div>
      </div>
    </>
  );
}
