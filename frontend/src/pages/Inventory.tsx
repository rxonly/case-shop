import { useEffect, useState } from 'react';
import { inventoryApi } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b',
};
const RARITY_LABELS: Record<string, string> = {
  common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный',
};

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState<number | null>(null);
  const { updateBalance, user} = useAuth();

  const load = () => inventoryApi.getMine().then(setItems).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const sell = async (invId: number) => {
    setSelling(invId);
    try {
      const res = await inventoryApi.sell(invId);
      const currentBalance = Number(user?.balance || 0);
      updateBalance(currentBalance + Number(res.earned));
      setItems((prev) => prev.filter((i) => i.id !== invId));
      alert(`Продано за ${Number(res.earned).toFixed(2)} ₽!`);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Ошибка продажи');
    } finally {
      setSelling(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">
      <h1 className="page__title">🎒 Мой инвентарь</h1>
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', padding: 60 }}>
          Инвентарь пуст. Откройте кейс, чтобы получить предметы!
        </div>
      ) : (
        <div className="grid grid-4">
          {items.map((inv) => (
            <div key={inv.id} className="inv-item" style={{ borderColor: RARITY_COLORS[inv.item.rarity] }}>
              <div style={{ fontSize: '2.5rem' }}>🎁</div>
              <div style={{ fontWeight: 600 }}>{inv.item.name}</div>
              <div style={{ color: RARITY_COLORS[inv.item.rarity], fontSize: '0.85rem' }}>
                {RARITY_LABELS[inv.item.rarity]}
              </div>
              <div style={{ color: 'var(--gold)', fontWeight: 600 }}>
                {Number(inv.item.value).toFixed(2)} ₽
              </div>
              <div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>
                {new Date(inv.obtainedAt).toLocaleDateString('ru-RU')}
              </div>
              <button
                className="btn btn-gold btn-sm"
                style={{ width: '100%', marginTop: 4 }}
                onClick={() => sell(inv.id)}
                disabled={selling === inv.id}
              >
                {selling === inv.id ? 'Продаём...' : 'Продать'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
