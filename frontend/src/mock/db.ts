import type { Cinema, Hall, Id, Movie, Role } from '../api/types';
import { toDateKey } from '../lib/format';

/** Тестовые данные повторяют макет. Даты считаются от сегодняшнего дня, поэтому сеансы всегда актуальны. */
export interface DbSession { id: Id; movieId: Id; cinemaId: Id; hallId: Id; startsAt: string; ticketPrice: number }
export interface DbTicket { id: Id; number: string; userId: Id; sessionId: Id; seatId: Id; status: 'issued'; createdAt: string; idempotencyKey?: string }
export interface DbUser { id: Id; name: string; email: string; role: Role; password: string }
export interface Db {
  seedDate: string;
  movies: Movie[];
  cinemas: Cinema[];
  halls: Hall[];
  sessions: DbSession[];
  tickets: DbTicket[];
  users: DbUser[];
  nextId: number;
}

// Версия в ключе: после смены структуры данных старая копия из браузера не подхватится.
const KEY = 'cw.mockDb.v3';
const OCCUPANCY_WIDTH = 12;

/** Занятые места с экрана 08 макета: номер ряда → номера мест. */
const OCCUPIED: Record<number, number[]> = { 1: [6], 2: [5, 6, 7, 8, 12], 3: [4, 11], 4: [3, 10], 5: [2, 9], 6: [1, 8], 7: [7] };

export const seatId = (hallId: Id, row: number, number: number): string => `${hallId}-${row}-${number}`;

/** У первого сеанса занятость как в макете, у остальных она отличается сдвигом. */
export function isInitiallyOccupied(sessionId: Id, row: number, number: number): boolean {
  const shift = Number(sessionId) === 1 ? 0 : Number(sessionId) % OCCUPANCY_WIDTH;
  return (OCCUPIED[row] ?? []).includes(((number - 1 + shift) % OCCUPANCY_WIDTH) + 1);
}

const movie = (id: number, title: string, image: string, year: number, ageRating: string, duration: number, genre: string, director: string, cast: string, description: string, extra: Partial<Movie> = {}): Movie =>
  ({ id, title, poster: `/images/${image}.jpg`, year, ageRating, duration, genre, director, cast, description, ...extra });

function seed(today = new Date()): Db {
  const movies = [
    movie(1, 'Дюна: Часть вторая', 'dune', 2024, '16+', 166, 'фантастика, приключения', 'Дени Вильнёв', 'Тимоти Шаламе, Зендея',
      'Продолжение истории Пола Атрейдеса на пустынной планете Арракис. Ему предстоит выбрать между любовью и судьбой целой вселенной.',
      { backdrop: '/images/dune-hero.jpg', tagline: 'Пол Атрейдес объединяется с Чани и фрименами, чтобы изменить судьбу Арракиса. История, которую стоит увидеть на большом экране.' }),
    movie(2, 'Интерстеллар', 'interstellar', 2014, '12+', 169, 'фантастика, драма', 'Кристофер Нолан', 'Мэттью Макконахи, Энн Хэтэуэй',
      'Группа исследователей отправляется через червоточину в поисках нового дома для человечества.'),
    movie(3, 'Бегущий по лезвию 2049', 'blade-runner', 2017, '18+', 164, 'фантастика, триллер', 'Дени Вильнёв', 'Райан Гослинг, Харрисон Форд',
      'Офицер полиции находит тайну, способную разрушить хрупкий порядок мира репликантов и людей.'),
    movie(4, 'Начало', 'inception', 2010, '12+', 148, 'фантастика, боевик', 'Кристофер Нолан', 'Леонардо Ди Каприо, Марион Котийяр',
      'Специалист по проникновению в сны получает задание не украсть идею, а внедрить её.'),
    movie(5, 'Оппенгеймер', 'oppenheimer', 2023, '18+', 180, 'драма, история', 'Кристофер Нолан', 'Киллиан Мёрфи, Эмили Блант',
      'История физика, возглавившего создание атомной бомбы, и цены его открытия.'),
    movie(6, 'Отель «Гранд Будапешт»', 'grand-budapest', 2014, '16+', 100, 'комедия, приключения', 'Уэс Андерсон', 'Рэйф Файнс, Тони Револори',
      'Консьерж легендарного отеля и его юный помощник оказываются в центре истории с украденной картиной.'),
  ];
  const cinemas: Cinema[] = [
    { id: 1, name: 'КАРО 11 Октябрь', address: 'Новый Арбат, 24' },
    { id: 2, name: 'Синема Парк', address: 'Пресненская набережная, 2' },
    { id: 3, name: 'Москино Космос', address: 'Проспект Мира, 109' },
  ];
  // Зал 6 и зал 3 с параметрами 240 мест на 8 рядов взяты из макета, остальные дополнены по их образцу.
  const halls: Hall[] = [
    { id: 1, cinemaId: 1, name: '6', category: '2D', seatCount: 84, rowCount: 7 },
    { id: 2, cinemaId: 1, name: '3', category: '2D', seatCount: 240, rowCount: 8 },
    { id: 3, cinemaId: 2, name: '1', category: '3D', seatCount: 84, rowCount: 7 },
    { id: 4, cinemaId: 3, name: '2', category: '2D', seatCount: 84, rowCount: 7 },
  ];
  const slots = [
    { cinemaId: 1, hallId: 1, hour: 19, minute: 30, ticketPrice: 650 },
    { cinemaId: 2, hallId: 3, hour: 20, minute: 0, ticketPrice: 850 },
    { cinemaId: 3, hallId: 4, hour: 18, minute: 15, ticketPrice: 450 },
  ];
  const sessions: DbSession[] = [];
  let id = 1;
  for (const m of movies) {
    for (let day = 0; day < 6; day++) {
      // Третья дата пустая: на ней виден экран «На эту дату сеансов нет» (S06).
      if (day === 2) continue;
      slots.forEach((s, i) => {
        let start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + day, s.hour, s.minute);
        // Вечером сегодняшние сеансы уже прошли: переносим их на ближайшее время, чтобы демо работало в любой час.
        if (start <= today) {
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59);
          start = new Date(Math.min(today.getTime() + (i + 1) * 20 * 60_000, endOfDay.getTime()));
        }
        sessions.push({ id: id++, movieId: m.id, cinemaId: s.cinemaId, hallId: s.hallId, startsAt: start.toISOString(), ticketPrice: s.ticketPrice });
      });
    }
  }
  // Прошедший сеанс для блока «История покупок».
  const pastId = id++;
  const past = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15, 18, 15);
  sessions.push({ id: pastId, movieId: 2, cinemaId: 3, hallId: 4, startsAt: past.toISOString(), ticketPrice: 450 });
  const tickets: DbTicket[] = [{
    id: 147, number: 'CW-2026-0147', userId: 1, sessionId: pastId, seatId: seatId(4, 4, 6), status: 'issued',
    createdAt: new Date(past.getTime() - 86_400_000).toISOString(),
  }];
  return {
    seedDate: toDateKey(today),
    movies, cinemas, halls, sessions, tickets,
    users: [
      { id: 1, name: 'Алексей Смирнов', email: 'user@example.com', role: 'user', password: 'password' },
      { id: 2, name: 'Администратор', email: 'admin@example.com', role: 'admin', password: 'admin' },
    ],
    nextId: 148,
  };
}

let cache: Db | null = null;

export function getDb(): Db {
  if (cache) return cache;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Db | null;
    // Устаревшие данные пересоздаём, чтобы сеансы не оказались в прошлом.
    if (saved && saved.seedDate === toDateKey(new Date())) return (cache = saved);
  } catch {
    // Повреждённые данные просто заменяем новыми.
  }
  return (cache = seed());
}

export function saveDb() {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

export function resetDb() {
  cache = null;
  localStorage.removeItem(KEY);
}
