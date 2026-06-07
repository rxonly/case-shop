import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesApi, gameApi } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#f59e0b',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

export default function CasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [rouletteItems, setRouletteItems] = useState<any[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) casesApi.getOne(Number(id)).then(setCaseData);
  }, [id]);

  const buildRouletteItems = (items: any[], winnerItem: any) => {
    const pool = Array.from({ length: 40 }, (_, i) => {
      if (i === 35) return winnerItem;
      return items[Math.floor(Math.random() * items.length)];
    });
    return pool;
  };

  const openCase = async () => {
    if (!caseData) return;
    setError('');
    setResult(null);
    setSpinning(true);

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = 'translateX(0)';
    }

    try {
      const data = await gameApi.openCase(Number(id));
      updateBalance(Number(data.balance));

      const items = buildRouletteItems(caseData.items, data.item);
      setRouletteItems(items);

      // Запускаем анимацию после рендера
      setTimeout(() => {
        if (trackRef.current) {
          const itemW = 128; // 120px + 8px gap
          const offset = 35 * itemW - (trackRef.current.parentElement!.offsetWidth / 2) + itemW / 2;
          trackRef.current.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
          trackRef.current.style.transform = `translateX(-${offset}px)`;
        }
        setTimeout(() => {
          setResult(data.item);
          setSpinning(false);
        }, 5200);
      }, 50);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка открытия кейса');
      setSpinning(false);
    }
  };

  if (!caseData) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        ← Назад
      </button>

      <h1 className="page__title">{caseData.name}</h1>
      {caseData.description && (
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{caseData.description}</p>
      )}

      {/* Рулетка */}
      {(spinning || result) && rouletteItems.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="roulette-wrap">
            <div className="roulette-pointer" />
            <div ref={trackRef} className="roulette-track">
              {rouletteItems.map((item, i) => (
                <div key={i} className="roulette-item" style={{ borderColor: RARITY_COLORS[item.rarity] }}>
                  <div style={{ fontSize: '2rem' }}>🎁</div>
                  <div style={{ fontSize: '0.75rem', color: RARITY_COLORS[item.rarity] }}>
                    {RARITY_LABELS[item.rarity]}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Результат */}
      {result && !spinning && (
        <div className="card" style={{ textAlign: 'center', marginBottom: 24, borderColor: RARITY_COLORS[result.rarity] }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: RARITY_COLORS[result.rarity] }}>
            {result.name}
          </div>
          <div style={{ color: RARITY_COLORS[result.rarity], marginBottom: 8 }}>
            {RARITY_LABELS[result.rarity]}
          </div>
          <div style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Стоимость: {Number(result.value).toFixed(2)} ₽
          </div>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Информация */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: 'var(--text2)' }}>Цена открытия:</span>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.2rem' }}>
            💰 {Number(caseData.price).toFixed(2)} ₽
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)' }}>Ваш баланс:</span>
          <span style={{ fontWeight: 600 }}>💰 {Number(user?.balance || 0).toFixed(2)} ₽</span>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
        onClick={openCase}
        disabled={spinning}
      >
        {spinning ? '🎰 Открываем...' : `🎁 Открыть за ${Number(caseData.price).toFixed(2)} ₽`}
      </button>

      {/* Содержимое кейса */}
      {caseData.items?.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Возможные призы</h2>
          <div className="grid grid-4">
            {caseData.items.map((item: any) => (
              <div key={item.id} className="inv-item">
                <div style={{ fontSize: '2rem' }}>🎁</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                <div style={{ color: RARITY_COLORS[item.rarity], fontSize: '0.8rem' }}>
                  {RARITY_LABELS[item.rarity]}
                </div>
                <div style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>
                  {Number(item.value).toFixed(2)} ₽
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
