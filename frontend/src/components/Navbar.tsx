import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__logo">🎁 CaseShop</NavLink>
      <div className="navbar__nav">
        <NavLink to="/" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
          Кейсы
        </NavLink>
        {user && (
          <>
            <NavLink to="/inventory" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
              Инвентарь
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
              Профиль
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
                🔧 Админ
              </NavLink>
            )}
            <span className="navbar__balance">💰 {Number(user.balance).toFixed(2)} ₽</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Выйти</button>
          </>
        )}
        {!user && (
          <>
            <NavLink to="/login" className="btn btn-ghost btn-sm">Войти</NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm">Регистрация</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
