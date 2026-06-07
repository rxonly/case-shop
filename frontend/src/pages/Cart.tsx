import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi, cartStorage } from '../utils/api';

export default function Cart() {
  // cartItems — массив {index, case} для каждой позиции
  const [cartItems, setCartItems] = useState<{ index: number; caseData: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    const ids = cartStorage.getCart();
    if (ids.length === 0) { setLoading(false); return; }
    const all = await casesApi.getAll();
    const items = ids.map((id, index) => ({
      index,
      caseData: all.find((c: any) => c.id === id),
    })).filter(item => item.caseData);
    setCartItems(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = (index: number) => {
    cartStorage.removeOne(index);
    // Пересчитываем индексы после удаления
    const ids = cartStorage.getCart();
    setCartItems(prev =>
      prev
        .filter(item => item.index !== index)
        .map((item, i) => ({ ...item, index: i }))
    );
  };

  const clearAll = () => {
    cartStorage.clearCart();
    setCartItems([]);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page__title" style={{ margin: 0 }}>🛒 Корзина</h1>
        {cartItems.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={clearAll}>
            Очистить корзину
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
          <div>Корзина пуста</div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            Перейти к кейсам
          </button>
        </div>
      ) : (
        <>
          {cartItems.map(({ index, caseData }) => (
            <div key={index} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
              <div style={{ fontSize: '3rem' }}>🎁</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{caseData.name}</div>
                {caseData.description && (
                  <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 4 }}>{caseData.description}</div>
                )}
                <div style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 6 }}>
                  💰 {Number(caseData.price).toFixed(2)} ₽
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    remove(index); // убираем из корзины
                    navigate(`/case/${caseData.id}`); // открываем кейс
                  }}
                >
                  Открыть
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(index)}>✕</button>
              </div>
            </div>
          ))}

          <div className="card" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Итого кейсов</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{cartItems.length} шт.</div>
            </div>
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Общая стоимость</div>
              <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.2rem' }}>
                💰 {cartItems.reduce((sum, { caseData }) => sum + Number(caseData.price), 0).toFixed(2)} ₽
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}