import { request } from './client';
import type {
  AdminSession, Cinema, CinemaInput, Hall, HallInput, Id, LoginResponse, Movie, MovieInput, RegisterInput, Seat, Session, SessionInput, Ticket, User,
} from './types';

const q = encodeURIComponent;

export const api = {
  movies: () => request<Movie[]>('GET', '/movies'),
  movie: (id: Id) => request<Movie>('GET', `/movies/${q(String(id))}`),
  sessions: (movieId: Id, date: string) =>
    request<Session[]>('GET', `/sessions?movieId=${q(String(movieId))}&date=${q(date)}`),
  seats: (sessionId: Id) => request<Seat[]>('GET', `/sessions/${q(String(sessionId))}/seats`),

  /** idempotencyKey один на попытку оформления: повтор запроса не создаст второй билет. */
  createTicket: (sessionId: Id, seatId: Id, idempotencyKey: string) =>
    request<Ticket>('POST', '/tickets', { body: { sessionId, seatId }, headers: { 'Idempotency-Key': idempotencyKey } }),
  ticket: (id: Id) => request<Ticket>('GET', `/tickets/${q(String(id))}`),

  login: (email: string, password: string) =>
    request<LoginResponse>('POST', '/auth/login', { body: { email, password } }),
  register: (body: RegisterInput) => request<LoginResponse>('POST', '/auth/register', { body }),
  me: () => request<User>('GET', '/me'),
  myTickets: () => request<Ticket[]>('GET', '/me/tickets'),

  admin: {
    movies: () => request<Movie[]>('GET', '/admin/movies'),
    createMovie: (body: MovieInput) => request<Movie>('POST', '/admin/movies', { body }),
    updateMovie: (id: Id, body: Partial<MovieInput>) => request<Movie>('PATCH', `/admin/movies/${q(String(id))}`, { body }),

    cinemas: () => request<Cinema[]>('GET', '/admin/cinemas'),
    createCinema: (body: CinemaInput) => request<Cinema>('POST', '/admin/cinemas', { body }),
    updateCinema: (id: Id, body: Partial<CinemaInput>) => request<Cinema>('PATCH', `/admin/cinemas/${q(String(id))}`, { body }),

    halls: () => request<Hall[]>('GET', '/admin/halls'),
    createHall: (body: HallInput) => request<Hall>('POST', '/admin/halls', { body }),
    updateHall: (id: Id, body: Partial<HallInput>) => request<Hall>('PATCH', `/admin/halls/${q(String(id))}`, { body }),

    sessions: () => request<AdminSession[]>('GET', '/admin/sessions'),
    createSession: (body: SessionInput) => request<AdminSession>('POST', '/admin/sessions', { body }),
    updateSession: (id: Id, body: Partial<SessionInput>) => request<AdminSession>('PATCH', `/admin/sessions/${q(String(id))}`, { body }),
  },
};
