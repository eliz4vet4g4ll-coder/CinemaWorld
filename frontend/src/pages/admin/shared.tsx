import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { BackLink } from '../../components/BackLink';
import { Button, ButtonLink } from '../../components/Button';
import { Feedback, Loading } from '../../components/Feedback';
import type { AsyncState } from '../../hooks/useAsync';

/** Всплывающее сообщение «Изменения сохранены» после возврата к списку. */
export function SavedToast() {
  const location = useLocation();
  const navigate = useNavigate();
  const saved = (location.state as { saved?: boolean } | null)?.saved;
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => navigate(location.pathname, { replace: true, state: null }), 4000);
    return () => clearTimeout(timer);
  }, [saved, location.pathname, navigate]);
  if (!saved) return null;
  return <div className="toast" role="status"><span aria-hidden="true">✓</span>&nbsp; Изменения сохранены</div>;
}

interface ListProps<T> {
  title: string;
  subtitle?: string;
  addLabel: string;
  addTo: string;
  state: AsyncState<T[]>;
  emptyTitle: string;
  emptyText: string;
  errorTitle: string;
  children: (items: T[]) => ReactNode;
}

/** Каркас страниц-списков со всеми состояниями: загрузка S16, ошибка S15, пусто S14. */
export function AdminList<T>({ title, subtitle, addLabel, addTo, state, emptyTitle, emptyText, errorTitle, children }: ListProps<T>) {
  const denied = state.error?.status === 403;
  return (
    <>
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">Администратор</p>
          <h1 className="h-display">{title}</h1>
          {subtitle && state.data && <p className="lead">{subtitle}</p>}
        </div>
        {state.data && state.data.length > 0 && <ButtonLink to={addTo} variant="primary">{addLabel}</ButtonLink>}
      </div>
      <div style={{ marginTop: 24 }}>
        {state.loading && <Loading />}
        {state.error && (
          <Feedback tone="error" title={denied ? 'Недостаточно прав' : errorTitle} text={denied ? 'Войдите с рабочей почты сотрудника.' : 'Повторите попытку.'}>
            {!denied && <Button onClick={state.reload}>Повторить</Button>}
          </Feedback>
        )}
        {state.data && state.data.length === 0 && (
          <Feedback title={emptyTitle} text={emptyText}>
            <ButtonLink to={addTo} variant="primary">{addLabel}</ButtonLink>
          </Feedback>
        )}
        {state.data && state.data.length > 0 && children(state.data)}
      </div>
      <SavedToast />
    </>
  );
}

export type FieldErrors = Record<string, string>;

/** Логика сохранения формы: проверка → A11 «Сохраняем» → список с сообщением, при сбое S17. */
export function useSaveFlow(listPath: string) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'edit' | 'saving' | 'failed'>('edit');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');

  const save = async (validate: () => FieldErrors, send: () => Promise<unknown>) => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setPhase('saving');
    try {
      await send();
      navigate(listPath, { state: { saved: true } });
    } catch (e) {
      // 400 с ошибками полей возвращает пользователя в форму, остальное показываем как сбой сохранения.
      if (e instanceof ApiError && e.status === 400 && Object.keys(e.fieldErrors).length) {
        setErrors(e.fieldErrors);
        setPhase('edit');
      } else {
        // 409 означает запрет по правилу сервера, поэтому показываем его объяснение, а не общий текст о сбое.
        setFailure(e instanceof ApiError && e.status === 409 ? e.message : '');
        setPhase('failed');
      }
    }
  };

  return { phase, errors, failure, save, backToForm: () => setPhase('edit'), hasErrors: Object.keys(errors).length > 0 };
}

interface FormShellProps {
  flow: ReturnType<typeof useSaveFlow>;
  title: string;
  backTo: string;
  backLabel: string;
  isNew: boolean;
  onSubmit: () => void;
  /** Куда ведёт «Отмена», если не туда же, куда ссылка «назад». */
  cancelTo?: string;
  /** Дополнительная кнопка между сохранением и отменой. */
  extraAction?: ReactNode;
  /** Содержимое под формой, внутри той же панели. */
  after?: ReactNode;
  children: ReactNode;
}

export function AdminFormShell({ flow, title, backTo, backLabel, isNew, onSubmit, cancelTo, extraAction, after, children }: FormShellProps) {
  if (flow.phase === 'saving') {
    return (
      <>
        <p className="eyebrow">Администратор</p>
        <h1 className="h-display" style={{ marginTop: 24 }}>Сохраняем данные</h1>
        <div className="panel" role="status" style={{ marginTop: 24 }}>
          <p className="h-title">Сохраняем данные…</p>
          <p className="lead" style={{ margin: '16px 0 24px' }}>Дождитесь завершения.</p>
          <Button variant="primary" loading style={{ minWidth: 300 }}>Сохранение…</Button>
        </div>
      </>
    );
  }
  if (flow.phase === 'failed') {
    return (
      <>
        <p className="eyebrow">Администратор</p>
        <h1 className="h-display" style={{ margin: '24px 0' }}>Изменения не сохранились</h1>
        <Feedback tone="error" title="Не удалось сохранить данные" text={flow.failure || 'Значения формы сохранены. Повторите попытку.'}>
          <Button onClick={flow.backToForm}>Вернуться к форме</Button>
        </Feedback>
      </>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <>
      <BackLink to={backTo}>{backLabel}</BackLink>
      <p className="eyebrow" style={{ marginTop: 24 }}>Администратор</p>
      <h1 className="h-display" style={{ marginTop: 24 }}>{title}</h1>
      <form className="admin-form" onSubmit={submit} noValidate>
        {flow.hasErrors && (
          <div className="form-alert" role="alert">
            <p className="h-sub text-danger">Проверьте поля формы</p>
            <p>Заполните обязательные поля. Введённые данные сохранены.</p>
          </div>
        )}
        {children}
        <div className="admin-form__footer">
          <div className="btn-row">
            <Button type="submit" variant="primary" style={{ minWidth: 260 }}>
              {flow.hasErrors ? 'Исправить данные' : isNew ? 'Добавить' : 'Сохранить изменения'}
            </Button>
            {extraAction}
            <ButtonLink to={cancelTo ?? backTo} variant="secondary" style={{ minWidth: 160 }}>Отмена</ButtonLink>
          </div>
          <p>* Обязательное поле</p>
        </div>
      </form>
      {after}
    </>
  );
}

/** Загрузка записи для редактирования: контракт отдаёт её через список GET /admin/{ресурс}. */
export function LoadingRecord({ state, notFound, backTo }: { state: { loading: boolean; error: ApiError | null; reload: () => void }; notFound: boolean; backTo: string }) {
  if (state.loading) return <Loading />;
  if (state.error) {
    return (
      <Feedback tone="error" title="Не удалось получить данные" text="Повторите попытку.">
        <Button onClick={state.reload}>Повторить</Button>
      </Feedback>
    );
  }
  if (notFound) {
    return (
      <Feedback title="Запись не найдена" text="Возможно, она была изменена.">
        <ButtonLink to={backTo}>К списку</ButtonLink>
      </Feedback>
    );
  }
  return null;
}
