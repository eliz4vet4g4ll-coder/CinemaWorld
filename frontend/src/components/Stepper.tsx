import { Fragment } from 'react';

const STEPS = ['Фильм', 'Дата', 'Сеансы', 'Сравнение', 'Место', 'Оформление', 'Билет'];

/** Шаги покупки. current — номер текущего шага, начиная с 1. */
export function Stepper({ current }: { current: number }) {
  return (
    <ol className="stepper" aria-label="Шаги покупки">
      {STEPS.map((name, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'current' : 'todo';
        return (
          <Fragment key={name}>
            {i > 0 && <li className="stepper__sep" aria-hidden="true">›</li>}
            <li className={`stepper__step stepper__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              {state === 'done' ? <span className="stepper__check" aria-hidden="true">✓</span> : <span className="stepper__num">{n}</span>} {name}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
