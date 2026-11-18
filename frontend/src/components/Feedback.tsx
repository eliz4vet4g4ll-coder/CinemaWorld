import type { ReactNode } from 'react';

/** Панель состояний из макета: пусто, ошибка, успех. */
export function Feedback({ title, text, tone, children }: { title: string; text?: ReactNode; tone?: 'error' | 'success'; children?: ReactNode }) {
  return (
    <section className="panel feedback" role={tone === 'error' ? 'alert' : undefined}>
      <h2 className={`h-title${tone === 'success' ? ' text-success' : ''}`}>{title}</h2>
      {text && <p className="text-muted">{text}</p>}
      {children && <div className="feedback__actions">{children}</div>}
    </section>
  );
}

const WIDTHS = [260, 448, 180, 180];

/** Загрузка: заглушка-сетка из кадров S01, S05, S08. */
export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <section className="panel feedback" role="status" aria-live="polite">
      <h2 className="h-title">Загружаем данные…</h2>
      <div className="skeleton" aria-hidden="true">
        {Array.from({ length: rows }, (_, r) => (
          <div className="skeleton__row" key={r}>
            {WIDTHS.map((w, i) => <span key={i} style={{ width: w }} />)}
          </div>
        ))}
      </div>
      <p className="text-muted">Это займёт несколько секунд.</p>
    </section>
  );
}
