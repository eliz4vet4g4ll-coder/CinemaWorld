import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { Role } from '../api/types';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { useAuth } from '../state/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Куда вести после входа: роль определяет сервер, форма входа одна для всех. */
function destination(role: Role, from?: string): string {
  const fromAdmin = from?.startsWith('/admin');
  if (role === 'admin') return fromAdmin ? from! : '/admin';
  return from && !fromAdmin ? from : '/account';
}

export function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [sending, setSending] = useState(false);

  if (ready && user && !sending) return <Navigate to={destination(user.role, from)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL.test(email.trim())) next.email = 'Введите корректный email.';
    if (!password) next.password = 'Введите пароль.';
    setErrors(next);
    if (next.email || next.password) return;

    setSending(true);
    try {
      const logged = await login(email.trim(), password);
      navigate(destination(logged.role, from), { replace: true });
    } catch (err) {
      setSending(false);
      setErrors({ form: err instanceof ApiError && err.status === 401 ? 'Неверный email или пароль.' : 'Не удалось войти. Повторите попытку.' });
    }
  };

  return (
    <div className="auth">
      <img className="auth__bg" src="/images/dune-hero.jpg" alt="" />
      <div className="auth__bg-dim" />
      <Link to="/" className="logo auth__logo">CINEMAWORLD</Link>
      <div className="auth__wrap">
        <form className="auth__form" onSubmit={submit} noValidate>
          <h1 className="h-display">Войти</h1>
          <TextField label="Email" type="email" autoComplete="username" placeholder="user@example.com" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Пароль" type="password" autoComplete="current-password" placeholder="••••••••••" value={password} error={errors.password} onChange={(e) => setPassword(e.target.value)} />
          {errors.form && <p className="text-danger" role="alert">{errors.form}</p>}
          <Button type="submit" variant="primary" wide loading={sending}>{sending ? 'Входим…' : 'Войти'}</Button>
          <p className="text-muted">Нет аккаунта? <Link to="/register" state={location.state} className="text-link">Зарегистрироваться</Link></p>
          <p><Link to="/" className="back-link"><span aria-hidden="true">‹</span>&nbsp; На главную</Link></p>
        </form>
      </div>
    </div>
  );
}
