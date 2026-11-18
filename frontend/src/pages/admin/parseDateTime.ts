/** Разбирает ДД.ММ.ГГГГ и ЧЧ:ММ. Возвращает null для несуществующей даты, например 31.02.2026. */
export function parseDateTime(dateText: string, timeText: string): Date | null {
  const d = dateText.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const t = timeText.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!d || !t) return null;
  const [day, month, year, hour, minute] = [+d[1], +d[2], +d[3], +t[1], +t[2]];
  if (hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
