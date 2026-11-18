import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { toDateKey } from '../lib/format';
import { useAuth } from '../state/auth';
import { parseDateTime } from './admin/parseDateTime';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Errors = { name?: string; birthDate?: string; email?: string; password?: string; form?: string };

export function RegisterPage() {
  const { user, ready, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [form, setForm] = useState({ name: '', birthDate: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  if (ready && user && !sending) return <Navigate to={user.role === 'admin' ? '/admin' : from ?? '/account'} replace />;

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = 'Укажите ФИО.';
    const birth = parseDateTime(form.birthDate, '00:00');
    if (!birth || !/^\d{2}\.\d{2}\.\d{4}$/.test(form.birthDate.trim())) e.birthDate = 'Укажите дату в формате ДД.ММ.ГГГГ.';
    else if (birth > new Date() || birth.getFullYear() < 1900) e.birthDate = 'Проверьте дату рождения.';
    if (!EMAIL.test(form.email.trim())) e.email = 'Введите корректный email.';
    if (form.password.length < MIN_PASSWORD) e.password = `Пароль должен быть не короче ${MIN_PASSWORD} символов.`;
    return e;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true);
    try {
      await register({
        name: form.name.trim(),
        birthDate: toDateKey(parseDateTime(form.birthDate, '00:00')!),
        email: form.email.trim(),
        password: form.password,
      });
      navigate(from ?? '/account', { replace: true });
    } catch (err) {
      setSending(false);
      if (err instanceof ApiError && err.status === 409) setErrors({ email: 'Этот email уже зарегистрирован.' });
      else if (err instanceof ApiError && err.status === 400 && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else setErrors({ form: 'Не удалось зарегистрироваться. Введённые данные сохранены, повторите попытку.' });
    }
  };

  return (
    <div className="auth auth--register">
      <img className="auth__bg" src="/images/dune-hero.jpg" alt="" />
      <div className="auth__bg-dim" />
      <Link to="/" className="logo auth__logo">CINEMAWORLD</Link>
      <div className="auth__wrap">
        <form className="auth__form" onSubmit={submit} noValidate>
          <h1 className="h-display">Регистрация</h1>
          <p className="auth__lead">Зарегистрируйтесь, чтобы иметь расширенный доступ к приложению</p>
          <TextField label="ФИО" autoComplete="name" placeholder="Иванов Иван Иванович" value={form.name} error={errors.name} onChange={set('name')} />
          <TextField className="field--tight" label="Дата рождения" inputMode="numeric" autoComplete="bday" placeholder="01.01.2001" value={form.birthDate} error={errors.birthDate} onChange={set('birthDate')} />
          <TextField label="Email" type="email" autoComplete="username" placeholder="user@example.com" value={form.email} error={errors.email} onChange={set('email')} />
          <TextField label="Пароль" type="password" autoComplete="new-password" placeholder="••••••••••" value={form.password} error={errors.password} onChange={set('password')} />
          {errors.form && <p className="text-danger" role="alert">{errors.form}</p>}
          <Button type="submit" variant="primary" wide loading={sending}>{sending ? 'Создаём аккаунт…' : 'Зарегистрироваться'}</Button>
          <p className="text-muted">Уже есть аккаунт? <Link to="/login" state={location.state} className="text-link">Войти</Link></p>
          <p><Link to="/" className="back-link"><span aria-hidden="true">‹</span>&nbsp; На главную</Link></p>
        </form>
      </div>
    </div>
  );
}
