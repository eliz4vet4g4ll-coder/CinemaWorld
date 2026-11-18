import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth';

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <header className="admin-header">
        <Link to="/admin" className="logo">CINEMAWORLD</Link>
        <span className="text-muted">Административная панель</span>
        <span className="admin-header__right">
          Администратор&nbsp; ·&nbsp; <button type="button" onClick={() => { logout(); navigate('/login'); }}>Выйти</button>
        </span>
      </header>
      <div className="admin-shell">
        <aside className="admin-side">
          <p className="eyebrow">Управление</p>
          <nav className="admin-side__nav" aria-label="Разделы">
            <NavLink to="/admin/movies">Фильмы</NavLink>
            <NavLink to="/admin/cinemas">Кинотеатры</NavLink>
            <NavLink to="/admin/sessions">Сеансы</NavLink>
          </nav>
          <p className="text-muted">Стоимость билетов задаётся в сеансе.</p>
        </aside>
        <main className="admin-main page-enter"><Outlet /></main>
      </div>
    </>
  );
}
