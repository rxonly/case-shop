import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.age ? Number(form.age) : undefined);
      navigate('/');
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Регистрация</h1>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label className="form__label">Имя *</label>
            <input className="form__input" value={form.name} onChange={set('name')} required placeholder="Иван Иванов" />
          </div>
          <div className="form__group">
            <label className="form__label">Email *</label>
            <input className="form__input" type="email" value={form.email} onChange={set('email')} required placeholder="user@example.com" />
          </div>
          <div className="form__group">
            <label className="form__label">Пароль *</label>
            <input className="form__input" type="password" value={form.password} onChange={set('password')} required placeholder="Минимум 6 символов" />
          </div>
          <div className="form__group">
            <label className="form__label">Возраст (необязательно)</label>
            <input className="form__input" type="number" value={form.age} onChange={set('age')} placeholder="18" min="0" max="150" />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--accent2)' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
