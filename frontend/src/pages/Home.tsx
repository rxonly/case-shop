import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi } from '../utils/api';

export default function Home() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    casesApi.getAll().then(setCases).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1 className="page__title">🎁 Доступные кейсы</h1>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', padding: 60 }}>
          Кейсов пока нет. Попросите администратора добавить кейсы.
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
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Открыть
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
