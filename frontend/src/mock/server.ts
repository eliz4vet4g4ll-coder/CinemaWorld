import type { TransportRequest, TransportResponse } from '../api/client';
import type { Id, Movie, Seat } from '../api/types';
import { toDateKey } from '../lib/format';
import { type Db, type DbSession, type DbTicket, getDb, isInitiallyOccupied, resetDb, saveDb, seatId } from './db';

/**
 * Мок REST API: работает по контракту из макета и возвращает те же коды ответа, что должен отдавать бэкенд.
 *
 * Состояния из макета можно включить параметром адреса, например ?mock=movies-error,slow:
 *   movies-error, movies-empty, sessions-error, me-tickets-error, me-tickets-empty, seats-error,
 *   tickets-error*, seat-conflict*, register-error*, hall-locked*, admin-error, admin-empty, save-error*, slow
 *   (* срабатывает один раз). ?mock=off отключает всё, ?mock=reset ещё и сбрасывает данные.
 */
const SCENARIO_KEY = 'cw.mockScenario';
const scenarios = new Set<string>();

function loadScenarios() {
  scenarios.clear();
  (sessionStorage.getItem(SCENARIO_KEY) ?? '').split(',').filter(Boolean).forEach((s) => scenarios.add(s));
}
function persistScenarios() {
  sessionStorage.setItem(SCENARIO_KEY, [...scenarios].join(','));
}
function consume(name: string): boolean {
  const hit = scenarios.delete(name);
  if (hit) persistScenarios();
  return hit;
}

export function applyScenarioFromUrl(search: string) {
  const value = new URLSearchParams(search).get('mock');
  if (value === null) return loadScenarios();
  if (value === 'reset') resetDb();
  sessionStorage.setItem(SCENARIO_KEY, value === 'off' || value === 'reset' ? '' : value);
  loadScenarios();
}

const ok = (data: unknown, status = 200): TransportResponse => ({ status, data });
const fail = (status: number, message: string, errors?: Record<string, string>): TransportResponse => ({ status, data: { message, errors } });
const same = (a: Id, b: Id) => String(a) === String(b);

const tokenFor = (userId: Id) => `mock-token-${userId}`;

function currentUser(db: Db, req: TransportRequest) {
  const token = req.headers.Authorization?.replace('Bearer ', '');
  return db.users.find((u) => tokenFor(u.id) === token);
}
const publicUser = ({ password: _password, ...user }: Db['users'][number]) => user;

function expandSession(db: Db, s: DbSession) {
  return { ...s, cinema: db.cinemas.find((c) => same(c.id, s.cinemaId))! };
}

function expandTicket(db: Db, t: DbTicket) {
  const { idempotencyKey: _key, ...ticket } = t;
  const session = db.sessions.find((s) => same(s.id, t.sessionId))!;
  const [row, number] = String(t.seatId).split('-').slice(-2).map(Number);
  return {
    ...ticket,
    movie: db.movies.find((m) => same(m.id, session.movieId))!,
    session: expandSession(db, session),
    seat: { row, number },
  };
}

function seatsFor(db: Db, session: DbSession): Seat[] {
  const seats: Seat[] = [];
  const hall = db.halls.find((h) => same(h.id, session.hallId));
  if (!hall) return seats;
  const seatsPerRow = hall.seatCount / hall.rowCount;
  for (let row = 1; row <= hall.rowCount; row++) {
    for (let number = 1; number <= seatsPerRow; number++) {
      const id = seatId(hall.id, row, number);
      const sold = db.tickets.some((t) => same(t.sessionId, session.id) && same(t.seatId, id));
      seats.push({ id, hallId: hall.id, row, number, occupied: sold || isInitiallyOccupied(session.id, row, number) });
    }
  }
  return seats;
}

/** Сеанс активен, пока не закончился фильм: идущие сеансы тоже запрещают менять зал. */
function hallHasActiveSessions(db: Db, hallId: Id): boolean {
  return db.sessions.some((s) => {
    if (!same(s.hallId, hallId)) return false;
    const minutes = db.movies.find((m) => same(m.id, s.movieId))?.duration ?? 0;
    return +new Date(s.startsAt) + minutes * 60_000 > Date.now();
  });
}

function validate(resource: string, body: Record<string, unknown>, partial: boolean): Record<string, string> {
  const required: Record<string, string[]> = {
    movies: ['title', 'duration', 'ageRating', 'genre', 'description'],
    cinemas: ['name', 'address'],
    halls: ['cinemaId', 'name', 'category', 'seatCount', 'rowCount'],
    sessions: ['movieId', 'cinemaId', 'hallId', 'startsAt', 'ticketPrice'],
  };
  const errors: Record<string, string> = {};
  for (const field of required[resource]) {
    if (partial && !(field in body)) continue;
    if (body[field] === undefined || body[field] === null || body[field] === '') errors[field] = 'Обязательное поле';
  }
  if ('ticketPrice' in body && !(Number(body.ticketPrice) > 0)) errors.ticketPrice = 'Стоимость должна быть больше 0 ₽.';
  return errors;
}

function admin(db: Db, method: string, resource: string, id: string | undefined, body: Record<string, unknown>): TransportResponse {
  const lists = { movies: db.movies, cinemas: db.cinemas, halls: db.halls, sessions: db.sessions } as const;
  if (!(resource in lists)) return fail(404, 'Ресурс не найден');
  const list = lists[resource as keyof typeof lists] as unknown as { id: Id }[];
  const view = (item: { id: Id }) => {
    if (resource === 'halls') return { ...item, hasActiveSessions: hallHasActiveSessions(db, item.id) };
    if (resource !== 'sessions') return item;
    const s = item as DbSession;
    return { ...expandSession(db, s), movieTitle: db.movies.find((m) => same(m.id, s.movieId))?.title ?? '' };
  };

  if (method === 'GET' && !id) {
    if (scenarios.has('admin-error')) return fail(500, 'Сбой сервера');
    return ok(scenarios.has('admin-empty') ? [] : list.map(view));
  }
  if (method === 'POST' || method === 'PATCH') {
    if (consume('save-error')) return fail(500, 'Сбой сервера');
    if (method === 'PATCH' && resource === 'halls' && (consume('hall-locked') || hallHasActiveSessions(db, id ?? ''))) {
      return fail(409, 'В этом зале есть сеансы, поэтому его нельзя редактировать.');
    }
    const errors = validate(resource, body, method === 'PATCH');
    const current = list.find((x) => same(x.id, id ?? '')) as Record<string, unknown> | undefined;
    const merged = { ...current, ...body };
    if (resource === 'halls') {
      const [seats, rows] = [Number(merged.seatCount), Number(merged.rowCount)];
      if (!(rows > 0 && seats > 0 && Number.isInteger(seats / rows))) errors.seatCount = 'Места должны поровну делиться на ряды.';
    }
    if (resource === 'sessions' && !db.halls.some((h) => same(h.id, merged.hallId as Id) && same(h.cinemaId, merged.cinemaId as Id))) {
      errors.hallId = 'Выберите зал этого кинотеатра.';
    }
    if (Object.keys(errors).length) return fail(400, 'Проверьте поля формы', errors);
    if (method === 'POST') {
      const created = { ...body, id: db.nextId++ };
      list.push(created);
      saveDb();
      return ok(view(created), 201);
    }
    const item = list.find((x) => same(x.id, id ?? ''));
    if (!item) return fail(404, 'Запись не найдена');
    Object.assign(item, body);
    saveDb();
    return ok(view(item));
  }
  return fail(405, 'Метод не поддерживается');
}

function route(req: TransportRequest): TransportResponse {
  const db = getDb();
  const url = new URL(req.path, 'http://mock');
  const { pathname: path, searchParams: params } = url;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const user = currentUser(db, req);
  let m: RegExpMatchArray | null;

  if (req.method === 'POST' && path === '/auth/login') {
    const found = db.users.find((u) => u.email === String(body.email ?? '').trim().toLowerCase() && u.password === body.password);
    if (!found) return fail(401, 'Неверный email или пароль');
    return ok({ token: tokenFor(found.id), user: publicUser(found) });
  }

  if (req.method === 'POST' && path === '/auth/register') {
    const email = String(body.email ?? '').trim().toLowerCase();
    if (consume('register-error')) return fail(500, 'Сбой сервера');
    if (!body.name || !body.birthDate || !email || String(body.password ?? '').length < 8) return fail(400, 'Проверьте поля формы');
    if (db.users.some((u) => u.email === email)) return fail(409, 'Этот email уже зарегистрирован');
    const created = { id: db.nextId++, name: String(body.name), email, role: 'user' as const, password: String(body.password) };
    db.users.push(created);
    saveDb();
    return ok({ token: tokenFor(created.id), user: publicUser(created) }, 201);
  }

  if (req.method === 'GET' && path === '/movies') {
    if (scenarios.has('movies-error')) return fail(500, 'Сбой сервера');
    return ok(scenarios.has('movies-empty') ? [] : db.movies);
  }
  if (req.method === 'GET' && (m = path.match(/^\/movies\/([^/]+)$/))) {
    const movie = db.movies.find((x: Movie) => same(x.id, m![1]));
    return movie ? ok(movie) : fail(404, 'Фильм не найден');
  }
  if (req.method === 'GET' && path === '/sessions') {
    if (scenarios.has('sessions-error')) return fail(500, 'Сбой сервера');
    const [movieId, date] = [params.get('movieId'), params.get('date')];
    if (!movieId || !date) return fail(400, 'Укажите movieId и date');
    return ok(db.sessions
      .filter((s) => same(s.movieId, movieId) && toDateKey(new Date(s.startsAt)) === date && +new Date(s.startsAt) > Date.now())
      .map((s) => expandSession(db, s)));
  }
  if (req.method === 'GET' && (m = path.match(/^\/sessions\/([^/]+)\/seats$/))) {
    if (scenarios.has('seats-error')) return fail(500, 'Сбой сервера');
    const session = db.sessions.find((s) => same(s.id, m![1]));
    return session ? ok(seatsFor(db, session)) : fail(404, 'Сеанс не найден');
  }

  if (!user) return fail(401, 'Требуется вход');

  if (req.method === 'POST' && path === '/tickets') {
    if (consume('tickets-error')) return fail(500, 'Сбой сервера');
    const session = db.sessions.find((s) => same(s.id, body.sessionId as Id));
    if (!session) return fail(404, 'Сеанс не найден');
    if (+new Date(session.startsAt) <= Date.now()) return fail(400, 'Сеанс уже начался');
    const key = req.headers['Idempotency-Key'];
    const repeated = key && db.tickets.find((t) => t.idempotencyKey === key);
    if (repeated) return ok(expandTicket(db, repeated));
    const seat = seatsFor(db, session).find((s) => same(s.id, body.seatId as Id));
    if (!seat) return fail(400, 'Такого места нет в зале');
    if (seat.occupied) return fail(409, 'Место уже занято');
    if (consume('seat-conflict')) {
      // Другой зритель успел занять это место раньше: так выглядит конфликт S13.
      db.tickets.push({ id: db.nextId++, number: 'CW-OTHER', userId: 0, sessionId: session.id, seatId: seat.id, status: 'issued', createdAt: new Date().toISOString() });
      saveDb();
      return fail(409, 'Место уже занято');
    }
    const id = db.nextId++;
    const ticket: DbTicket = {
      id, number: `CW-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`, userId: user.id, sessionId: session.id,
      seatId: seat.id, status: 'issued', createdAt: new Date().toISOString(), idempotencyKey: key,
    };
    db.tickets.push(ticket);
    saveDb();
    return ok(expandTicket(db, ticket), 201);
  }
  if (req.method === 'GET' && (m = path.match(/^\/tickets\/([^/]+)$/))) {
    const ticket = db.tickets.find((t) => same(t.id, m![1]));
    if (!ticket) return fail(404, 'Билет не найден');
    if (!same(ticket.userId, user.id) && user.role !== 'admin') return fail(403, 'Нет доступа');
    return ok(expandTicket(db, ticket));
  }
  if (req.method === 'GET' && path === '/me') return ok(publicUser(user));
  if (req.method === 'GET' && path === '/me/tickets') {
    if (scenarios.has('me-tickets-error')) return fail(500, 'Сбой сервера');
    if (scenarios.has('me-tickets-empty')) return ok([]);
    return ok(db.tickets.filter((t) => same(t.userId, user.id)).map((t) => expandTicket(db, t)));
  }

  if ((m = path.match(/^\/admin\/([^/]+)(?:\/([^/]+))?$/))) {
    if (user.role !== 'admin') return fail(403, 'Нет доступа');
    return admin(db, req.method, m[1], m[2], body);
  }
  return fail(404, 'Маршрут не найден');
}

export async function mockTransport(req: TransportRequest): Promise<TransportResponse> {
  const delay = scenarios.has('slow') ? 2500 : 250;
  await new Promise((resolve) => setTimeout(resolve, delay));
  // Копия ответа: страницы не должны случайно менять «базу».
  return JSON.parse(JSON.stringify(route(req))) as TransportResponse;
}
