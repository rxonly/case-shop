import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { gameApi, usersApi } from '../utils/api';

export default function Profile() {
  const { user, updateBalance } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await gameApi.topUp(Number(amount));
      updateBalance(Number(res.balance));
      setSuccess(`Баланс пополнен на ${amount} ₽`);
      setAmount('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка пополнения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <h1 className="page__title">👤 Профиль</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <table className="table">
          <tbody>
            <tr>
              <td style={{ color: 'var(--text2)' }}>ID</td>
              <td>#{user?.id}</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text2)' }}>Имя</td>
              <td>{user?.name}</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text2)' }}>Email</td>
              <td>{user?.email}</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text2)' }}>Роль</td>
              <td>
                <span style={{
                  background: user?.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(34,197,94,0.15)',
                  color: user?.role === 'admin' ? 'var(--accent2)' : 'var(--success)',
                  padding: '2px 10px', borderRadius: 20, fontSize: '0.85rem'
                }}>
                  {user?.role === 'admin' ? '🔧 Администратор' : '👤 Пользователь'}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text2)' }}>Баланс</td>
              <td style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>
                💰 {Number(user?.balance || 0).toFixed(2)} ₽
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>💳 Пополнить баланс</h2>
        <form className="form" onSubmit={handleTopUp}>
          <div className="form__group">
            <label className="form__label">Сумма (₽)</label>
            <input
              className="form__input"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="100"
            />
          </div>
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-gold" type="submit" disabled={loading}>
            {loading ? 'Пополняем...' : 'Пополнить'}
          </button>
        </form>
      </div>
    </div>
  );
}
