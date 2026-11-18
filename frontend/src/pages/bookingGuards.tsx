import type { ReactNode } from 'react';
import { ButtonLink } from '../components/Button';
import { Feedback } from '../components/Feedback';

/** Показываем, если страницу шага открыли напрямую и выбор пользователя неизвестен. */
export function BookingLost({ children }: { children?: ReactNode }) {
  return (
    <div className="container">
      <Feedback title="Данные выбора не найдены" text="Начните с выбора фильма, это займёт несколько секунд.">
        {children ?? <ButtonLink to="/catalog">В каталог</ButtonLink>}
      </Feedback>
    </div>
  );
}
