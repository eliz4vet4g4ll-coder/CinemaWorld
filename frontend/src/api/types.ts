// Типы повторяют контракт из Figma (фрейм «Data & REST API»).
// Уточнения к контракту описаны в docs/api-contract.md.
export type Id = number | string;
export type Role = 'user' | 'admin';

export interface Movie {
  id: Id;
  title: string;
  description: string;
  poster: string;
  duration: number;
  ageRating: string;
  year: number | null;
  genre: string;
  director: string;
  cast: string;
  /** Необязательные поля для hero-блока. */
  backdrop?: string;
  tagline?: string;
}

export interface Cinema {
  id: Id;
  name: string;
  address: string;
}

export interface Hall {
  id: Id;
  cinemaId: Id;
  name: string;
  category: string;
  seatCount: number;
  rowCount: number;
  /** Вычисляет сервер: в зале есть идущие или предстоящие сеансы, редактировать его нельзя. */
  hasActiveSessions?: boolean;
}

export interface Session {
  id: Id;
  movieId: Id;
  cinemaId: Id;
  hallId: Id;
  startsAt: string;
  ticketPrice: number;
  cinema: Cinema;
}

export interface AdminSession extends Session {
  movieTitle: string;
}

export interface Seat {
  id: Id;
  hallId: Id;
  row: number;
  number: number;
  occupied: boolean;
}

export interface Ticket {
  id: Id;
  number: string;
  userId: Id;
  sessionId: Id;
  seatId: Id;
  status: 'issued';
  createdAt: string;
  movie: Movie;
  session: Session;
  seat: Pick<Seat, 'row' | 'number'>;
}

export interface User {
  id: Id;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type MovieInput = Omit<Movie, 'id'>;
export type CinemaInput = Omit<Cinema, 'id'>;
export type HallInput = Omit<Hall, 'id' | 'hasActiveSessions'>;
export type SessionInput = Pick<Session, 'movieId' | 'cinemaId' | 'hallId' | 'startsAt' | 'ticketPrice'>;

export interface RegisterInput {
  name: string;
  /** YYYY-MM-DD */
  birthDate: string;
  email: string;
  password: string;
}
