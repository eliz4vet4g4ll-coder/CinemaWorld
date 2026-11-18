import type { ReactNode } from 'react';
import type { Movie } from '../api/types';
import { duration, mainGenre, splitTitle } from '../lib/format';
import { Poster } from './Poster';

export function Hero({ movie, eyebrow, text, tall, children }: { movie: Movie; eyebrow: string; text: string; tall?: boolean; children: ReactNode }) {
  const [title, subtitle] = splitTitle(movie.title);
  const meta = [movie.year, movie.ageRating, duration(movie.duration), mainGenre(movie.genre)].filter(Boolean);
  return (
    <section className={`hero${tall ? ' hero--tall' : ''}`}>
      <Poster className="hero__image" src={movie.backdrop || movie.poster} />
      <div className="hero__shade" />
      <div className="hero__content">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="hero__title">{title}</h1>
        {subtitle && <p className="hero__subtitle">{subtitle}</p>}
        <p className="hero__meta">{meta.map((item, i) => <span key={i}>{item}</span>)}</p>
        <p className="hero__text">{text}</p>
        <div className="hero__actions">{children}</div>
      </div>
    </section>
  );
}
