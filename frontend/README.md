# CinemaWorld: фронтенд

Веб-приложение для поиска и сравнения киносеансов. Интерфейс сделан по макету Figma
«CinemaWorld · MVP & Prototype (Copy)»: React 19, TypeScript, Vite, React Router.

## Запуск

Нужен Node.js 20 или новее.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

По умолчанию приложение работает на тестовых данных и бэкенд не нужен.

| Учётная запись | Email | Пароль |
|---|---|---|
| Посетитель | `user@example.com` | `password` |
| Сотрудник | `admin@example.com` | `admin` |

Форма входа одна (`/login`): после входа посетитель попадает в кабинет, сотрудник — в админку. Это только тестовые данные мока, они не попадают в сборку с настоящим API.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | сервер разработки |
| `npm test` | модульные тесты |
| `npm run build` | проверка типов и сборка в `dist/` |
| `npm run preview` | просмотр сборки |

## Подключение бэкенда

Скопируйте `.env.example` в `.env` и укажите:

```bash
VITE_API_MODE=real
VITE_API_URL=/api
VITE_API_PROXY=http://localhost:8080   # адрес бэкенда для dev-сервера
```

На dev-сервере `/api/movies` проксируется на `http://localhost:8080/movies`. Что ожидается от API, описано в
[docs/api-contract.md](docs/api-contract.md).

Режим задаётся при сборке, поэтому для стенда нужно собирать с `VITE_API_MODE=real`, иначе в приложении окажутся тестовые данные.

## Развёртывание

`dist/` — статические файлы. Сервер должен отдавать `index.html` для всех маршрутов и проксировать API, например в nginx:

```nginx
location /api/ { proxy_pass http://127.0.0.1:8080/; }
location /     { try_files $uri /index.html; }
```

## Структура

```
src/
  api/          запросы к серверу и типы данных
  mock/         мок REST API: те же пути и коды ответа, что и у бэкенда
  state/        вход пользователя и выбор в пути покупки
  components/   компоненты дизайн-системы
  pages/        экраны посетителя, pages/admin — экраны администратора
  styles/       токены и стили из Figma
```

## Состояния из макета

В режиме мока их можно увидеть, добавив параметр к адресу. Выбор сохраняется до закрытия вкладки,
`?mock=off` выключает всё, `?mock=reset` ещё и сбрасывает данные.

| Экран Figma | Адрес |
|---|---|
| S01, S05, S08, S16 загрузка | любая страница с `?mock=slow` |
| S02 ничего не найдено | поиск «Аватар 9» |
| S03 / S04 каталог: ошибка, пусто | `/catalog?mock=movies-error`, `/catalog?mock=movies-empty` |
| S06 нет сеансов | третья дата при выборе даты |
| S07 сеансы: ошибка | `/movies/1/sessions?mock=sessions-error` |
| S09 / S10 кабинет: пусто, ошибка | `/account?mock=me-tickets-empty`, `/account?mock=me-tickets-error` |
| S12 оформление: ошибка | `?mock=tickets-error`, затем пройти путь до билета |
| S13, S18 место занято | `?mock=seat-conflict`, затем пройти путь до билета |
| S14 / S15 админ: пусто, ошибка | `/admin/movies?mock=admin-empty`, `/admin/movies?mock=admin-error` |
| S17 ошибка сохранения | `/admin/cinemas/new?mock=save-error` |
| Регистрация: сбой сервера | `/register?mock=register-error` |
| Зал заблокирован во время правки (409) | `/admin/cinemas/1/halls/2?mock=hall-locked`, затем сохранить |
