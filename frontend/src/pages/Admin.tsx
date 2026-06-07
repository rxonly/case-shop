import { useEffect, useState } from 'react';
import { casesApi, itemsApi, usersApi } from '../utils/api';

type Tab = 'cases' | 'items' | 'users';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('cases');
  const [cases, setCases] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Case form
  const [caseForm, setCaseForm] = useState({ name: '', description: '', price: '', imageUrl: '', isActive: true });
  const [editCaseId, setEditCaseId] = useState<number | null>(null);

  // Item form
  const [itemForm, setItemForm] = useState({ name: '', rarity: 'common', value: '', imageUrl: '' });
  const [editItemId, setEditItemId] = useState<number | null>(null);

  const loadCases = () => casesApi.getAllAdmin().then(setCases);
  const loadItems = () => itemsApi.getAll().then(setItems);
  const loadUsers = () => usersApi.getAll().then(setUsers);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCases(), loadItems(), loadUsers()]).finally(() => setLoading(false));
  }, []);

  // CASES CRUD
  const saveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...caseForm, price: Number(caseForm.price) };
    if (editCaseId) {
      await casesApi.update(editCaseId, payload);
      setEditCaseId(null);
    } else {
      await casesApi.create(payload);
    }
    setCaseForm({ name: '', description: '', price: '', imageUrl: '', isActive: true });
    loadCases();
  };
  const deleteCase = async (id: number) => {
    if (!confirm('Удалить кейс?')) return;
    await casesApi.delete(id);
    loadCases();
  };
  const editCase = (c: any) => {
    setEditCaseId(c.id);
    setCaseForm({ name: c.name, description: c.description || '', price: String(c.price), imageUrl: c.imageUrl || '', isActive: c.isActive });
  };

  // ITEMS CRUD
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...itemForm, value: Number(itemForm.value) };
    if (editItemId) {
      await itemsApi.update(editItemId, payload);
      setEditItemId(null);
    } else {
      await itemsApi.create(payload);
    }
    setItemForm({ name: '', rarity: 'common', value: '', imageUrl: '' });
    loadItems();
  };
  const deleteItem = async (id: number) => {
    if (!confirm('Удалить предмет?')) return;
    await itemsApi.delete(id);
    loadItems();
  };
  const editItem = (item: any) => {
    setEditItemId(item.id);
    setItemForm({ name: item.name, rarity: item.rarity, value: String(item.value), imageUrl: item.imageUrl || '' });
  };

const tabStyle = (t: Tab) => ({
  padding: '10px 24px',
  borderBottom: tab === t ? '2px solid var(--accent2)' : '2px solid transparent',
  color: tab === t ? 'var(--text)' : 'var(--text2)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  fontWeight: tab === t ? 600 : 400,
  fontSize: '0.95rem',
} as any);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="page__title">🔧 Панель администратора</h1>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <button style={tabStyle('cases')} onClick={() => setTab('cases')}>Кейсы ({cases.length})</button>
        <button style={tabStyle('items')} onClick={() => setTab('items')}>Предметы ({items.length})</button>
        <button style={tabStyle('users')} onClick={() => setTab('users')}>Пользователи ({users.length})</button>
      </div>

      {/* CASES */}
      {tab === 'cases' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
              {editCaseId ? '✏️ Редактировать кейс' : '➕ Новый кейс'}
            </h2>
            <form className="form" onSubmit={saveCase}>
              {[['name','Название','text',true],['description','Описание','text',false],['price','Цена (₽)','number',true],['imageUrl','URL картинки','text',false]].map(([k,label,type,req]) => (
                <div className="form__group" key={k as string}>
                  <label className="form__label">{label as string}{req ? ' *' : ''}</label>
                  <input className="form__input" type={type as string} required={req as boolean}
                    value={(caseForm as any)[k as string]}
                    onChange={(e) => setCaseForm((p) => ({ ...p, [k as string]: e.target.value }))} />
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={caseForm.isActive}
                  onChange={(e) => setCaseForm((p) => ({ ...p, isActive: e.target.checked }))} />
                <span className="form__label">Активен</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">{editCaseId ? 'Сохранить' : 'Создать'}</button>
                {editCaseId && <button className="btn btn-ghost" type="button" onClick={() => { setEditCaseId(null); setCaseForm({ name:'',description:'',price:'',imageUrl:'',isActive:true }); }}>Отмена</button>}
              </div>
            </form>
          </div>
          <div>
            <table className="table">
              <thead><tr><th>ID</th><th>Название</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text2)' }}>#{c.id}</td>
                    <td>{c.name}</td>
                    <td style={{ color: 'var(--gold)' }}>{Number(c.price).toFixed(2)} ₽</td>
                    <td><span style={{ color: c.isActive ? 'var(--success)' : 'var(--danger)' }}>{c.isActive ? '✅ Активен' : '❌ Скрыт'}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => editCase(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCase(c.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ITEMS */}
      {tab === 'items' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
              {editItemId ? '✏️ Редактировать предмет' : '➕ Новый предмет'}
            </h2>
            <form className="form" onSubmit={saveItem}>
              <div className="form__group">
                <label className="form__label">Название *</label>
                <input className="form__input" required value={itemForm.name}
                  onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form__group">
                <label className="form__label">Редкость</label>
                <select className="form__input" value={itemForm.rarity}
                  onChange={(e) => setItemForm((p) => ({ ...p, rarity: e.target.value }))}>
                  <option value="common">Обычный</option>
                  <option value="rare">Редкий</option>
                  <option value="epic">Эпический</option>
                  <option value="legendary">Легендарный</option>
                </select>
              </div>
              <div className="form__group">
                <label className="form__label">Стоимость (₽) *</label>
                <input className="form__input" type="number" required value={itemForm.value}
                  onChange={(e) => setItemForm((p) => ({ ...p, value: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">{editItemId ? 'Сохранить' : 'Создать'}</button>
                {editItemId && <button className="btn btn-ghost" type="button" onClick={() => { setEditItemId(null); setItemForm({ name:'',rarity:'common',value:'',imageUrl:'' }); }}>Отмена</button>}
              </div>
            </form>
          </div>
          <div>
            <table className="table">
              <thead><tr><th>ID</th><th>Название</th><th>Редкость</th><th>Стоимость</th><th>Действия</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text2)' }}>#{item.id}</td>
                    <td>{item.name}</td>
                    <td className={`rarity-${item.rarity}`}>{item.rarity}</td>
                    <td style={{ color: 'var(--gold)' }}>{Number(item.value).toFixed(2)} ₽</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => editItem(item)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <table className="table">
          <thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Возраст</th><th>Роль</th><th>Баланс</th><th>Дата</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ color: 'var(--text2)' }}>#{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.age ?? '—'}</td>
                <td><span style={{ color: u.role === 'admin' ? 'var(--accent2)' : 'var(--text2)' }}>{u.role}</span></td>
                <td style={{ color: 'var(--gold)' }}>{Number(u.balance).toFixed(2)} ₽</td>
                <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
