import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi, cartStorage } from '../utils/api';

export default function Home() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    casesApi.getAll().then(setCases).finally(() => setLoading(false));
    setCartCount(cartStorage.getCart().length);
  }, []);

  const addToCart = (e: React.MouseEvent, caseId: number) => {
    e.stopPropagation();
    cartStorage.addToCart(caseId);
    setCartCount(cartStorage.getCart().length);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page__title" style={{ margin: 0 }}>🎁 Доступные кейсы</h1>
        {cartCount > 0 && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px' }}>
            🛒 В корзине: <strong>{cartCount}</strong> кейс(ов)
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="grid grid-3">
          {cases.map((c) => (
            <div key={c.id} className="case-card" onClick={() => navigate(`/case/${c.id}`)}>
              <div className="case-card__img" style={{ fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🎁
              </div>
              <div className="case-card__name">{c.name}</div>
              {c.description && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)', textAlign: 'center' }}>{c.description}</div>
              )}
              <div className="case-card__price">💰 {Number(c.price).toFixed(2)} ₽</div>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>
                  Открыть
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={(e) => addToCart(e, c.id)}
                  title="Добавить в корзину"
                >
                  🛒
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}