import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Вход в аккаунт</h1>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label className="form__label">Email</label>
            <input className="form__input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="user@example.com" />
          </div>
          <div className="form__group">
            <label className="form__label">Пароль</label>
            <input className="form__input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required placeholder="••••••" />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>
          Нет аккаунта? <Link to="/register" style={{ color: 'var(--accent2)' }}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
