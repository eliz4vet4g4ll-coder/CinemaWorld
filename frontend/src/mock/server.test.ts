import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransportRequest } from '../api/client';

const memoryStorage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

async function setup(search = '?mock=off') {
  vi.resetModules();
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('sessionStorage', memoryStorage());
  const { applyScenarioFromUrl, mockTransport } = await import('./server');
  const { resetDb } = await import('./db');
  resetDb();
  applyScenarioFromUrl(search);
  const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    mockTransport({ method, path, body, headers } as TransportRequest);
  const login = async (email = 'user@example.com', password = 'password') => {
    const res = await call('POST', '/auth/login', { email, password });
    return { Authorization: `Bearer ${(res.data as { token: string }).token}` };
  };
  return { call, login };
}

const firstOpenSeat = async (call: Awaited<ReturnType<typeof setup>>['call'], sessionId: number) => {
  const seats = (await call('GET', `/sessions/${sessionId}/seats`)).data as { id: string; occupied: boolean }[];
  return seats.find((s) => !s.occupied)!;
};

describe('правила оформления из макета', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('оформление требует входа', async () => {
    const { call } = await setup();
    expect((await call('POST', '/tickets', { sessionId: 4, seatId: '1-1-1' })).status).toBe(401);
    expect((await call('GET', '/me')).status).toBe(401);
  });

  it('неверный пароль даёт 401', async () => {
    const { call } = await setup();
    expect((await call('POST', '/auth/login', { email: 'user@example.com', password: 'x' })).status).toBe(401);
  });

  it('занятость определяется для конкретного сеанса: второй билет на место даёт 409', async () => {
    const { call, login } = await setup();
    const auth = await login();
    const seat = await firstOpenSeat(call, 4);
    expect((await call('POST', '/tickets', { sessionId: 4, seatId: seat.id }, auth)).status).toBe(201);
    expect((await call('POST', '/tickets', { sessionId: 4, seatId: seat.id }, auth)).status).toBe(409);
    const after = (await call('GET', '/sessions/4/seats')).data as { id: string; occupied: boolean }[];
    expect(after.find((s) => s.id === seat.id)?.occupied).toBe(true);
  });

  it('один запрос не создаёт два билета: повтор с тем же ключом возвращает первый', async () => {
    const { call, login } = await setup();
    const auth = await login();
    const seat = await firstOpenSeat(call, 4);
    const headers = { ...auth, 'Idempotency-Key': 'k1' };
    const a = await call('POST', '/tickets', { sessionId: 4, seatId: seat.id }, headers);
    const b = await call('POST', '/tickets', { sessionId: 4, seatId: seat.id }, headers);
    expect((a.data as { id: number }).id).toBe((b.data as { id: number }).id);
    expect(((await call('GET', '/me/tickets', undefined, auth)).data as unknown[]).length).toBe(2);
  });

  it('чужой билет недоступен, а админские операции закрыты для пользователя', async () => {
    const { call, login } = await setup();
    const admin = await login('admin@example.com', 'admin');
    const user = await login();
    const seat = await firstOpenSeat(call, 4);
    const created = (await call('POST', '/tickets', { sessionId: 4, seatId: seat.id }, admin)).data as { id: number };
    expect((await call('GET', `/tickets/${created.id}`, undefined, user)).status).toBe(403);
    expect((await call('GET', `/tickets/${created.id}`, undefined, admin)).status).toBe(200);
    expect((await call('GET', '/admin/movies', undefined, user)).status).toBe(403);
    expect((await call('GET', '/admin/movies', undefined, admin)).status).toBe(200);
  });

  it('изменение цены администратором обновляет данные сеанса', async () => {
    const { call, login } = await setup();
    const admin = await login('admin@example.com', 'admin');
    expect((await call('PATCH', '/admin/sessions/4', { ticketPrice: 0 }, admin)).status).toBe(400);
    expect((await call('PATCH', '/admin/sessions/4', { ticketPrice: 999 }, admin)).status).toBe(200);
    const list = (await call('GET', '/admin/sessions', undefined, admin)).data as { id: number; ticketPrice: number }[];
    expect(list.find((s) => s.id === 4)?.ticketPrice).toBe(999);
  });

  it('схема зала строится из его параметров', async () => {
    const { call, login } = await setup();
    const admin = await login('admin@example.com', 'admin');
    const startsAt = new Date(Date.now() + 86_400_000).toISOString();
    const created = (await call('POST', '/admin/sessions', { movieId: 1, cinemaId: 1, hallId: 2, startsAt, ticketPrice: 500 }, admin)).data as { id: number };
    const seats = (await call('GET', `/sessions/${created.id}/seats`)).data as { row: number; number: number }[];
    expect(seats.length).toBe(240);
    expect(Math.max(...seats.map((s) => s.row))).toBe(8);
    expect(Math.max(...seats.map((s) => s.number))).toBe(30);
  });

  it('зал проверяется: места делятся на ряды, зал принадлежит кинотеатру', async () => {
    const { call, login } = await setup();
    const admin = await login('admin@example.com', 'admin');
    const bad = await call('POST', '/admin/halls', { cinemaId: 1, name: '9', category: '2D', seatCount: 241, rowCount: 8 }, admin);
    expect(bad.status).toBe(400);
    const startsAt = new Date(Date.now() + 86_400_000).toISOString();
    const foreign = await call('POST', '/admin/sessions', { movieId: 1, cinemaId: 2, hallId: 1, startsAt, ticketPrice: 500 }, admin);
    expect(foreign.status).toBe(400);
    expect((foreign.data as { errors: Record<string, string> }).errors.hallId).toBeTruthy();
  });

  it('зал с идущими и предстоящими сеансами редактировать нельзя', async () => {
    const { call, login } = await setup();
    const admin = await login('admin@example.com', 'admin');
    const flag = async (id: number) => ((await call('GET', '/admin/halls', undefined, admin)).data as { id: number; hasActiveSessions: boolean }[]).find((h) => h.id === id)?.hasActiveSessions;

    expect(await flag(1)).toBe(true);
    expect((await call('PATCH', '/admin/halls/1', { name: 'X' }, admin)).status).toBe(409);

    // В зале 2 сеансов нет: редактировать можно.
    expect(await flag(2)).toBe(false);
    expect((await call('PATCH', '/admin/halls/2', { name: 'X' }, admin)).status).toBe(200);

    // Закончившийся сеанс не мешает: «Дюна» идёт 166 минут, начало 4 часа назад.
    const add = (startsAt: number) => call('POST', '/admin/sessions', { movieId: 1, cinemaId: 1, hallId: 2, startsAt: new Date(startsAt).toISOString(), ticketPrice: 500 }, admin);
    await add(Date.now() - 4 * 3_600_000);
    expect(await flag(2)).toBe(false);

    // Идущий сеанс мешает: начало 10 минут назад.
    await add(Date.now() - 10 * 60_000);
    expect(await flag(2)).toBe(true);
    expect((await call('PATCH', '/admin/halls/2', { name: 'Y' }, admin)).status).toBe(409);
  });

  it('регистрация создаёт пользователя и не пускает занятый email', async () => {
    const { call } = await setup();
    const input = { name: 'Иванов Иван', birthDate: '2001-01-01', email: 'Ivan@Example.com', password: 'password1' };
    const res = await call('POST', '/auth/register', input);
    expect(res.status).toBe(201);
    expect((res.data as { user: { role: string; email: string } }).user).toMatchObject({ role: 'user', email: 'ivan@example.com' });
    expect(JSON.stringify(res.data)).not.toContain('password1');
    expect((await call('POST', '/auth/register', input)).status).toBe(409);
    expect((await call('POST', '/auth/login', { email: 'ivan@example.com', password: 'password1' })).status).toBe(200);
  });

  it('прошедшие сеансы не предлагаются', async () => {
    const { call } = await setup();
    const past = new Date(Date.now() - 15 * 86_400_000);
    const key = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
    expect((await call('GET', `/sessions?movieId=2&date=${key}`)).data).toEqual([]);
  });
});
