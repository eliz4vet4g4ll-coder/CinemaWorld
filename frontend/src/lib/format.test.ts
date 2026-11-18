import { describe, expect, it } from 'vitest';
import { duration, fromDateKey, fullDateWeekday, mainGenre, plural, price, randomKey, splitTitle, toDateKey, upcomingDates } from './format';

describe('format', () => {
  it('склоняет числительные', () => {
    const f: [string, string, string] = ['фильм', 'фильма', 'фильмов'];
    expect([1, 2, 5, 11, 21, 22, 112].map((n) => plural(n, f))).toEqual(['фильм', 'фильма', 'фильмов', 'фильмов', 'фильм', 'фильма', 'фильмов']);
  });
  it('форматирует длительность как в макете', () => {
    expect(duration(166)).toBe('2 ч 46 мин');
    expect(duration(120)).toBe('2 ч');
    expect(duration(45)).toBe('45 мин');
  });
  it('форматирует дату как в макете', () => {
    expect(fullDateWeekday(new Date(2026, 9, 3))).toBe('3 октября 2026, суббота');
  });
  it('разбирает заголовок hero', () => {
    expect(splitTitle('Дюна: Часть вторая')).toEqual(['ДЮНА', 'ЧАСТЬ ВТОРАЯ']);
    expect(splitTitle('Начало')).toEqual(['НАЧАЛО']);
  });
  it('даёт основной жанр и цену', () => {
    expect(mainGenre('фантастика, приключения')).toBe('Фантастика');
    expect(price(650)).toBe('650 ₽');
  });
  it('считает даты через границу месяца без сдвига часового пояса', () => {
    expect(upcomingDates(3, new Date(2026, 9, 31, 23, 30))).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
    expect(toDateKey(fromDateKey('2026-03-08'))).toBe('2026-03-08');
  });
  it('создаёт разные ключи попытки', () => {
    expect(randomKey()).toMatch(/^[0-9a-f]{32}$/);
    expect(randomKey()).not.toBe(randomKey());
  });
});
