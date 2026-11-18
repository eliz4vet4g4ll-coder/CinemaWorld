import { Link } from 'react-router-dom';
import type { Movie } from '../api/types';
import { mainGenre } from '../lib/format';
import { Poster } from './Poster';

export const movieMeta = (m: Movie) => [m.year, m.ageRating, mainGenre(m.genre)].filter(Boolean).join(' · ');

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <span className="movie-card__image"><Poster className="movie-card__img" src={movie.poster} /></span>
      <span className="movie-card__body">
        <span className="movie-card__title">{movie.title}</span>
        <span className="movie-card__meta">{movieMeta(movie)}</span>
      </span>
    </Link>
  );
}
