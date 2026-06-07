import axios from 'axios';

const BASE_URL = '/api';

// LocalStorage keys
const TOKEN_KEY = 'caseshop_token';
const USER_KEY = 'caseshop_user';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  },
  setUser: (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

const api = axios.create({ baseURL: BASE_URL });

// Добавляем JWT из LocalStorage к каждому запросу
api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Обработка 401 — разлогиниваем
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      storage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string, age?: number) =>
    api.post('/users', { name, email, password, age }).then((r) => r.data),
};

// Users (GET /users, GET /users/:id, POST /users)
export const usersApi = {
  getAll: () => api.get('/users').then((r) => r.data),
  getById: (id: number) => api.get(`/users/${id}`).then((r) => r.data),
};

// Cases
export const casesApi = {
  getAll: () => api.get('/cases').then((r) => r.data),
  getAllAdmin: () => api.get('/cases/admin/all').then((r) => r.data),
  getOne: (id: number) => api.get(`/cases/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/cases', data).then((r) => r.data),
  update: (id: number, data: any) => api.put(`/cases/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/cases/${id}`).then((r) => r.data),
};

// Items
export const itemsApi = {
  getAll: () => api.get('/items').then((r) => r.data),
  create: (data: any) => api.post('/items', data).then((r) => r.data),
  update: (id: number, data: any) => api.put(`/items/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/items/${id}`).then((r) => r.data),
};

// Inventory
export const inventoryApi = {
  getMine: () => api.get('/inventory').then((r) => r.data),
  sell: (id: number) => api.post(`/inventory/${id}/sell`).then((r) => r.data),
};

// Game
export const gameApi = {
  openCase: (caseId: number) => api.post(`/game/open/${caseId}`).then((r) => r.data),
  topUp: (amount: number) => api.post('/game/topup', { amount }).then((r) => r.data),
};

export default api;

// Корзина в LocalStorage
export const cartStorage = {
  getCart: (): number[] => {
    const data = localStorage.getItem('caseshop_cart');
    return data ? JSON.parse(data) : [];
  },
  addToCart: (caseId: number) => {
    const cart = cartStorage.getCart();
    cart.push(caseId); // убрали проверку на дубликат
    localStorage.setItem('caseshop_cart', JSON.stringify(cart));
  },
  removeOne: (index: number) => {
    const cart = cartStorage.getCart();
    cart.splice(index, 1); // удаляем только одну позицию по индексу
    localStorage.setItem('caseshop_cart', JSON.stringify(cart));
  },
  clearCart: () => localStorage.removeItem('caseshop_cart'),
};