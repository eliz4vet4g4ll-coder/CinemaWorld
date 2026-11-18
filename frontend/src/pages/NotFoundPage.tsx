import { ButtonLink } from '../components/Button';
import { Feedback } from '../components/Feedback';

export function NotFoundPage() {
  return (
    <div className="container">
      <Feedback title="Страница не найдена" text="Проверьте адрес или вернитесь на главную.">
        <ButtonLink to="/">На главную</ButtonLink>
      </Feedback>
    </div>
  );
}
