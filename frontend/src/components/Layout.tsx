import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';

function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' nav-link--active' : ''}`;
  return (
    <header className="site-header">
      <Link to="/" className="logo">CINEMAWORLD</Link>
      <nav className="site-header__nav" aria-label="Основная навигация">
        <NavLink to="/" end className={navClass}>Главная</NavLink>
        <NavLink to="/catalog" className={navClass}>Каталог</NavLink>
      </nav>
      <div className="site-header__right">
        <button type="button" className="nav-link nav-link--bright" onClick={() => navigate('/catalog', { state: { focusSearch: true } })}>
          <span className="icon-search" aria-hidden="true" />&nbsp; Поиск
        </button>
        {user && user.role === 'user' ? (
          <Link to="/account" className="nav-link nav-link--bright">{user.name.split(' ')[0]}&nbsp; <span aria-hidden="true">▾</span></Link>
        ) : user ? (
          <Link to="/admin" className="nav-link nav-link--bright">Админ-панель</Link>
        ) : (
          <Link to="/login" className="nav-link nav-link--bright">Войти</Link>
        )}
      </div>
    </header>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <Header />
      <main key={pathname} className="page-enter"><Outlet /></main>
    </>
  );
}
