export const USE_MOCK = import.meta.env.VITE_API_MODE !== 'real';
const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'cw.token';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export interface TransportRequest {
  method: string;
  path: string;
  body?: unknown;
  headers: Record<string, string>;
}
export interface TransportResponse {
  status: number;
  data: unknown;
}

async function fetchTransport({ method, path, body, headers }: TransportRequest): Promise<TransportResponse> {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Сервер вернул не JSON (например, страницу ошибки прокси): статус всё равно обработаем ниже.
  }
  return { status: res.status, data };
}

async function transport(req: TransportRequest): Promise<TransportResponse> {
  if (USE_MOCK) {
    const { mockTransport } = await import('../mock/server');
    return mockTransport(req);
  }
  return fetchTransport(req);
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const token = tokenStore.get();
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };

  let res: TransportResponse;
  try {
    res = await transport({ method, path, body: options.body, headers });
  } catch {
    throw new ApiError(0, 'Нет связи с сервером');
  }

  if (res.status >= 200 && res.status < 300) return res.data as T;

  // Истёкший токен: сбрасываем сессию. Запрос входа сюда не относится, там 401 значит «неверный пароль».
  if (res.status === 401 && token && !path.startsWith('/auth/')) onUnauthorized();
  const payload = (res.data ?? {}) as { message?: string; errors?: Record<string, string> };
  throw new ApiError(res.status, payload.message ?? 'Ошибка сервера', payload.errors);
}
