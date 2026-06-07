import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { cartStorage } from '../utils/api';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  // Обновляем счётчик при каждом изменении маршрута
  useEffect(() => {
    setCartCount(cartStorage.getCart().length);
  }, [location]);

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
            <NavLink to="/cart" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
              🛒 Корзина {cartCount > 0 && (
                <span style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '1px 7px',
                  fontSize: '0.75rem',
                  marginLeft: 4,
                }}>
                  {cartCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
              Инвентарь
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
              Профиль
            </NavLink>
            {user.role === 'admin' && (
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