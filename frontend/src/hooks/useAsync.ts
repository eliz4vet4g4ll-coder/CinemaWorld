import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>({ data: null, error: null, loading: true });
  const lastRun = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    const id = ++lastRun.current;
    setState({ data: null, error: null, loading: true });
    load().then(
      // Ответ устаревшего запроса отбрасываем: пользователь мог уже сменить дату или фильм.
      (data) => { if (id === lastRun.current) setState({ data, error: null, loading: false }); },
      (e: unknown) => {
        if (id === lastRun.current) {
          setState({ data: null, loading: false, error: e instanceof ApiError ? e : new ApiError(0, 'Неизвестная ошибка') });
        }
      },
    );
  }, deps);

  useEffect(run, [run]);
  return { ...state, reload: run };
}
