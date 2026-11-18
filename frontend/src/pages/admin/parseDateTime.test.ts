import { describe, expect, it } from 'vitest';
import { parseDateTime } from './parseDateTime';

describe('parseDateTime', () => {
  it('принимает корректные значения', () => {
    expect(parseDateTime('03.10.2026', '19:30')).toEqual(new Date(2026, 9, 3, 19, 30));
  });
  it('отклоняет несуществующие дату и время', () => {
    expect(parseDateTime('31.02.2026', '19:30')).toBeNull();
    expect(parseDateTime('03.10.2026', '24:00')).toBeNull();
    expect(parseDateTime('2026-10-03', '19:30')).toBeNull();
    expect(parseDateTime('', '')).toBeNull();
  });
});
