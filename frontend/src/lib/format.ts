const part = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ru-RU', options).format(date);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Локальная дата в формате YYYY-MM-DD (toISOString сдвинул бы её в UTC). */
export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Разбирает YYYY-MM-DD как локальную дату. */
export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Ближайшие дни для выбора сеанса: макет показывает шесть дат. */
export function upcomingDates(count = 6, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => toDateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)));
}

export const weekdayShort = (d: Date) => capitalize(part(d, { weekday: 'short' }));
export const dayMonth = (d: Date) => part(d, { day: 'numeric', month: 'long' });
export const dayMonthShort = (d: Date) => part(d, { day: 'numeric', month: 'short' }).replace('.', '');
export const fullDate = (d: Date) => `${dayMonth(d)} ${d.getFullYear()}`;
export const fullDateWeekday = (d: Date) => `${fullDate(d)}, ${part(d, { weekday: 'long' })}`;
export const weekdayFullDate = (d: Date) => `${capitalize(part(d, { weekday: 'long' }))}, ${fullDate(d)}`;
export const time = (iso: string) => part(new Date(iso), { hour: '2-digit', minute: '2-digit' });

export function price(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} ч` : '', m ? `${m} мин` : ''].filter(Boolean).join(' ') || '0 мин';
}

/** 1 фильм, 2 фильма, 5 фильмов. */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  return b === 1 ? forms[0] : forms[2];
}

/** Первый жанр с заглавной буквы: «фантастика, приключения» → «Фантастика». */
export const mainGenre = (genre: string) => capitalize(genre.split(',')[0].trim());
export const genres = (genre: string) => genre.split(',').map((g) => capitalize(g.trim())).filter(Boolean);

/** Заголовок hero: «Дюна: Часть вторая» → ДЮНА / ЧАСТЬ ВТОРАЯ. */
export function splitTitle(title: string): [string, string?] {
  const i = title.indexOf(':');
  return i < 0 ? [title.toUpperCase()] : [title.slice(0, i).toUpperCase(), title.slice(i + 1).trim().toUpperCase()];
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

/** Случайный ключ. crypto.randomUUID есть только на HTTPS и localhost, а учебный стенд может работать по HTTP. */
export function randomKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}
